/**
 * Server-authoritative auction engine.
 * Every mutation goes through here; the DB row `Auction#1` is the single source of truth.
 * An in-process mutex serialises mutations so concurrent bids can't race.
 */
import { Prisma, AuctionState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuctionSnapshot, BidSnapshot, SocketEvent } from "@/types/auction";

export class AuctionError extends Error {
  constructor(message: string, public code = "INVALID") { super(message); }
}

type Emitter = (event: SocketEvent, payload: unknown) => void;
/**
 * Next.js bundles this module separately for API routes from the copy loaded by the custom
 * server (server.ts). All cross-copy state therefore lives on globalThis so there is exactly
 * one emitter, one mutex and one timer per process.
 */
const G = globalThis as unknown as { __hpl?: { emit: Emitter; chain: Promise<unknown>; timer: NodeJS.Timeout | null } };
G.__hpl ??= { emit: () => {}, chain: Promise.resolve(), timer: null };
const shared = G.__hpl;
const emit: Emitter = (e, p) => shared.emit(e, p);
export function setEmitter(fn: Emitter) { shared.emit = fn; }

// ---- simple async mutex ---------------------------------------------------
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = shared.chain.then(fn, fn);
  shared.chain = run.catch(() => {});
  return run;
}

// ---- helpers --------------------------------------------------------------
export async function getSettings() {
  return prisma.auctionSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
async function getAuction(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  return tx.auction.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

function clearTimer() { if (shared.timer) clearTimeout(shared.timer); shared.timer = null; }
function scheduleTimerEnd(endsAt: Date) {
  clearTimer();
  const ms = Math.max(0, endsAt.getTime() - Date.now());
  shared.timer = setTimeout(() => { onTimerExpired().catch(console.error); }, ms + 20);
}
async function onTimerExpired() {
  await withLock(async () => {
    const a = await getAuction();
    if (a.state !== "PLAYER_LIVE" || !a.timerRunning || !a.timerEndsAt) return;
    if (a.timerEndsAt.getTime() > Date.now()) { scheduleTimerEnd(a.timerEndsAt); return; }
    await prisma.auction.update({ where: { id: 1 }, data: { timerRunning: false, timerRemainingMs: 0 } });
    await broadcast("timer:updated", { expired: true });
  });
}

/** Re-arm the timer after a server restart. */
export async function resumeTimerOnBoot() {
  const a = await getAuction();
  if (a.state === "PLAYER_LIVE" && a.timerRunning && a.timerEndsAt) scheduleTimerEnd(a.timerEndsAt);
}

// ---- snapshot -------------------------------------------------------------
export async function getSnapshot(): Promise<AuctionSnapshot> {
  const [a, settings, teams, counts] = await Promise.all([
    getAuction(), getSettings(),
    prisma.team.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.player.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count._all ?? 0;
  const currentPlayer = a.currentPlayerId ? await prisma.player.findUnique({ where: { id: a.currentPlayerId } }) : null;
  const bids = a.currentPlayerId
    ? await prisma.bid.findMany({ where: { playerId: a.currentPlayerId }, include: { team: true }, orderBy: { createdAt: "desc" }, take: 50 })
    : [];
  const highest = a.highestTeamId ? teams.find((t) => t.id === a.highestTeamId) : null;
  const pool = c("APPROVED") + c("WAITING") + c("LIVE") + c("SOLD") + c("UNSOLD") + c("SKIPPED");
  return {
    state: a.state,
    currentPlayer: currentPlayer && {
      id: currentPlayer.id, name: currentPlayer.name, photoUrl: currentPlayer.photoUrl, role: currentPlayer.role,
      battingStyle: currentPlayer.battingStyle, bowlingStyle: currentPlayer.bowlingStyle, age: currentPlayer.age,
      basePrice: currentPlayer.basePrice, status: currentPlayer.status, matches: currentPlayer.matches,
      runs: currentPlayer.runs, wickets: currentPlayer.wickets, bio: currentPlayer.bio, hostelBlock: currentPlayer.hostelBlock,
    },
    currentBid: a.currentBid,
    highestTeamId: a.highestTeamId,
    highestTeamName: highest?.name ?? null,
    timerEndsAt: a.timerEndsAt?.getTime() ?? null,
    timerRemainingMs: a.timerRemainingMs,
    timerRunning: a.timerRunning,
    timerSeconds: settings.timerSeconds,
    bidIncrement: settings.bidIncrement,
    teams: teams.map((t) => ({
      id: t.id, name: t.name, abbreviation: t.abbreviation, color: t.color, logoUrl: t.logoUrl, captainName: t.captainName,
      purse: t.purse, spent: t.spent, squadCount: t.squadCount, maxSquad: settings.maxSquadSize,
    })),
    bids: bids.map<BidSnapshot>((b) => ({ id: b.id, teamId: b.teamId, teamName: b.team.name, color: b.team.color, amount: b.amount, createdAt: b.createdAt.toISOString() })),
    playersRemaining: c("APPROVED") + c("WAITING"),
    totalPlayers: pool,
    soldCount: c("SOLD"),
    unsoldCount: c("UNSOLD"),
    serverTime: Date.now(),
    version: a.version,
  };
}

async function broadcast(event: SocketEvent, payload: unknown = {}) {
  const snap = await getSnapshot();
  emit(event, { ...(payload as object), snapshot: snap });
}
export const emitSnapshot = (event: SocketEvent, payload: object = {}) => broadcast(event, payload);

async function log(type: string, data: Partial<Prisma.AuctionEventUncheckedCreateInput> = {}, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  return tx.auctionEvent.create({ data: { type, ...data } });
}

function assertState(state: AuctionState, allowed: AuctionState[], what: string) {
  if (!allowed.includes(state)) throw new AuctionError(`Cannot ${what} while auction is ${state}`, "BAD_STATE");
}

// ---- auction lifecycle ----------------------------------------------------
async function shuffleWaitingQueue(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const pool = await tx.player.findMany({ where: { status: { in: ["APPROVED", "WAITING"] } }, select: { id: true } });
  // Fisher–Yates
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  for (const [i, p] of pool.entries()) await tx.player.update({ where: { id: p.id }, data: { queueOrder: i + 1 } });
  return pool.length;
}

/** Randomise the order of the remaining queue. */
export const shuffleQueue = () => withLock(async () => {
  const n = await shuffleWaitingQueue();
  await log("QUEUE_SHUFFLED", { payload: { count: n } });
  await broadcast("state:sync");
  return n;
});

export const startAuction = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["WAITING"], "start auction");
  await shuffleWaitingQueue(); // players come up in random order
  await prisma.$transaction([
    prisma.auction.update({ where: { id: 1 }, data: { state: "LIVE", startedAt: new Date(), version: { increment: 1 } } }),
    prisma.player.updateMany({ where: { status: "APPROVED" }, data: { status: "WAITING" } }),
    prisma.notification.create({ data: { type: "AUCTION_STARTED", title: "Auction started", message: "The HPL auction is now LIVE." } }),
  ]);
  await log("AUCTION_STARTED");
  await broadcast("auction:started");
});

export const pauseAuction = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["LIVE", "PLAYER_LIVE"], "pause");
  const remaining = a.timerRunning && a.timerEndsAt ? Math.max(0, a.timerEndsAt.getTime() - Date.now()) : a.timerRemainingMs;
  clearTimer();
  await prisma.auction.update({ where: { id: 1 }, data: { state: "PAUSED", timerRunning: false, timerRemainingMs: remaining, timerEndsAt: null, version: { increment: 1 } } });
  await log("AUCTION_PAUSED", { payload: { previousState: a.state } });
  await prisma.notification.create({ data: { type: "AUCTION_PAUSED", title: "Auction paused", message: "Bidding is temporarily paused." } });
  await broadcast("auction:paused");
});

export const resumeAuction = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PAUSED"], "resume");
  const next: AuctionState = a.currentPlayerId ? "PLAYER_LIVE" : "LIVE";
  await prisma.auction.update({ where: { id: 1 }, data: { state: next, version: { increment: 1 } } });
  await log("AUCTION_RESUMED");
  await prisma.notification.create({ data: { type: "AUCTION_RESUMED", title: "Auction resumed", message: "Bidding has resumed." } });
  await broadcast("auction:resumed");
});

export const completeAuction = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["LIVE", "PAUSED", "SOLD", "UNSOLD"], "complete");
  clearTimer();
  await prisma.auction.update({ where: { id: 1 }, data: { state: "COMPLETED", completedAt: new Date(), currentPlayerId: null, timerRunning: false, timerEndsAt: null, version: { increment: 1 } } });
  await log("AUCTION_COMPLETED");
  await prisma.notification.create({ data: { type: "AUCTION_COMPLETED", title: "Auction complete", message: "The HPL auction has concluded. View the final results." } });
  await broadcast("auction:completed");
});

/** Admin-only reset back to WAITING (keeps players/teams but clears sales). Used for demos/tests. */
export const resetAuction = () => withLock(async () => {
  clearTimer();
  await prisma.$transaction(async (tx) => {
    await tx.squadPlayer.deleteMany();
    await tx.bid.deleteMany();
    await tx.auctionEvent.deleteMany();
    await tx.player.updateMany({ where: { status: { in: ["WAITING", "LIVE", "SOLD", "UNSOLD", "SKIPPED"] } }, data: { status: "APPROVED", soldPrice: null, soldToId: null, soldAt: null } });
    const teams = await tx.team.findMany();
    for (const t of teams) await tx.team.update({ where: { id: t.id }, data: { purse: t.startingPurse, spent: 0, squadCount: 0 } });
    await tx.auction.update({ where: { id: 1 }, data: { state: "WAITING", currentPlayerId: null, currentBid: 0, highestTeamId: null, highestBidId: null, timerEndsAt: null, timerRemainingMs: null, timerRunning: false, startedAt: null, completedAt: null, version: { increment: 1 } } });
  });
  await broadcast("state:sync");
});

// ---- player lifecycle -----------------------------------------------------
async function pickNextPlayerId(): Promise<string | null> {
  const p = await prisma.player.findFirst({ where: { status: "WAITING" }, orderBy: [{ queueOrder: "asc" }, { createdAt: "asc" }] });
  return p?.id ?? null;
}

export const startPlayer = (playerId?: string) => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["LIVE", "SOLD", "UNSOLD"], "start a player");
  const id = playerId ?? (await pickNextPlayerId());
  if (!id) throw new AuctionError("No players remaining in the queue", "EMPTY_QUEUE");
  const p = await prisma.player.findUnique({ where: { id } });
  if (!p) throw new AuctionError("Player not found", "NOT_FOUND");
  if (p.status !== "WAITING" && p.status !== "APPROVED") throw new AuctionError(`Player is ${p.status}, not available`, "BAD_PLAYER_STATE");
  clearTimer();
  await prisma.$transaction([
    prisma.player.update({ where: { id }, data: { status: "LIVE" } }),
    prisma.auction.update({ where: { id: 1 }, data: { state: "PLAYER_LIVE", currentPlayerId: id, currentBid: 0, highestTeamId: null, highestBidId: null, timerEndsAt: null, timerRemainingMs: null, timerRunning: false, version: { increment: 1 } } }),
  ]);
  await log("PLAYER_STARTED", { playerId: id });
  await broadcast("player:started", { playerId: id });
});

export const startTimer = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE"], "start timer");
  const s = await getSettings();
  const ms = a.timerRemainingMs && a.timerRemainingMs > 0 ? a.timerRemainingMs : s.timerSeconds * 1000;
  const endsAt = new Date(Date.now() + ms);
  await prisma.auction.update({ where: { id: 1 }, data: { timerEndsAt: endsAt, timerRunning: true, timerRemainingMs: null, version: { increment: 1 } } });
  scheduleTimerEnd(endsAt);
  await broadcast("timer:updated", { action: "start" });
});

export const resetTimer = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE", "PAUSED"], "reset timer");
  const s = await getSettings();
  clearTimer();
  if (a.state === "PLAYER_LIVE") {
    const endsAt = new Date(Date.now() + s.timerSeconds * 1000);
    await prisma.auction.update({ where: { id: 1 }, data: { timerEndsAt: endsAt, timerRunning: true, timerRemainingMs: null, version: { increment: 1 } } });
    scheduleTimerEnd(endsAt);
  } else {
    await prisma.auction.update({ where: { id: 1 }, data: { timerEndsAt: null, timerRunning: false, timerRemainingMs: s.timerSeconds * 1000, version: { increment: 1 } } });
  }
  await broadcast("timer:updated", { action: "reset" });
});

export const pauseTimer = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE"], "pause timer");
  if (!a.timerRunning || !a.timerEndsAt) return;
  clearTimer();
  const remaining = Math.max(0, a.timerEndsAt.getTime() - Date.now());
  await prisma.auction.update({ where: { id: 1 }, data: { timerRunning: false, timerEndsAt: null, timerRemainingMs: remaining, version: { increment: 1 } } });
  await broadcast("timer:updated", { action: "pause" });
});

// ---- bidding --------------------------------------------------------------
export interface BidInput { userId: string; teamId: string; amount?: number }

export const placeBid = (input: BidInput) => withLock(async () => {
  const [a, s, user, team] = await Promise.all([
    getAuction(), getSettings(),
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.team.findUnique({ where: { id: input.teamId } }),
  ]);
  if (!user) throw new AuctionError("Not authenticated", "UNAUTHENTICATED");
  if (user.role !== "CAPTAIN" || user.teamId !== input.teamId || !team) throw new AuctionError("You can only bid for your own team", "FORBIDDEN");
  if (a.state === "PAUSED") throw new AuctionError("Auction is paused", "PAUSED");
  if (a.state === "COMPLETED") throw new AuctionError("Auction is completed", "COMPLETED");
  if (a.state !== "PLAYER_LIVE" || !a.currentPlayerId) throw new AuctionError("No player is live", "NO_PLAYER");
  const player = await prisma.player.findUnique({ where: { id: a.currentPlayerId } });
  if (!player || player.status !== "LIVE") throw new AuctionError("Player is not live", "PLAYER_NOT_LIVE");
  if (!a.timerRunning || !a.timerEndsAt || a.timerEndsAt.getTime() <= Date.now()) throw new AuctionError("Bidding is closed — timer has expired", "TIMER_CLOSED");
  if (team.squadCount >= s.maxSquadSize) throw new AuctionError("Squad full (11/11)", "SQUAD_FULL");
  if (a.highestTeamId === team.id) throw new AuctionError("You are already the highest bidder", "ALREADY_HIGHEST");

  const minNext = a.currentBid === 0 ? player.basePrice : a.currentBid + s.bidIncrement;
  const amount = input.amount ?? minNext;
  const anchor = a.currentBid > 0 ? a.currentBid : player.basePrice;
  if ((amount - anchor) % s.bidIncrement !== 0) throw new AuctionError(`Bid must follow ₹${s.bidIncrement} increments`, "BAD_INCREMENT");
  if (amount < minNext) throw new AuctionError(`Bid must be at least ${minNext}`, "TOO_LOW");
  if (amount > team.purse) throw new AuctionError("Insufficient purse", "INSUFFICIENT_PURSE");

  const endsAt = new Date(Date.now() + s.timerSeconds * 1000);
  const bid = await prisma.$transaction(async (tx) => {
    const fresh = await tx.auction.findUniqueOrThrow({ where: { id: 1 } });
    if (fresh.version !== a.version) throw new AuctionError("Auction state changed, retry", "CONFLICT");
    const b = await tx.bid.create({ data: { playerId: player.id, teamId: team.id, userId: user.id, amount } });
    await tx.auction.update({ where: { id: 1 }, data: { currentBid: amount, highestTeamId: team.id, highestBidId: b.id, timerEndsAt: endsAt, timerRunning: true, timerRemainingMs: null, version: { increment: 1 } } });
    return b;
  });
  scheduleTimerEnd(endsAt);
  if (a.highestTeamId && a.highestTeamId !== team.id) {
    const outbid = await prisma.user.findFirst({ where: { teamId: a.highestTeamId } });
    if (outbid) await prisma.notification.create({ data: { userId: outbid.id, type: "OUTBID", title: "You've been outbid", message: `${team.name} bid ${amount} on ${player.name}.` } });
  }
  await broadcast("bid:accepted", { bidId: bid.id, teamId: team.id, teamName: team.name, amount, playerId: player.id });
  return bid;
});

// ---- sell / unsold / skip -------------------------------------------------
export const sellPlayer = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE"], "sell");
  if (!a.currentPlayerId || !a.highestTeamId || !a.highestBidId || a.currentBid <= 0) throw new AuctionError("No winning bid — mark UNSOLD instead", "NO_BID");
  const s = await getSettings();
  clearTimer();
  const result = await prisma.$transaction(async (tx) => {
    // Row-level locks on the critical records.
    const [team] = await tx.$queryRaw<{ id: string; purse: number; squadCount: number }[]>`SELECT id, purse, squadCount FROM Team WHERE id = ${a.highestTeamId} FOR UPDATE`;
    const [player] = await tx.$queryRaw<{ id: string; status: string; name: string }[]>`SELECT id, status, name FROM Player WHERE id = ${a.currentPlayerId} FOR UPDATE`;
    const bid = await tx.bid.findUniqueOrThrow({ where: { id: a.highestBidId! } });
    if (!team || !player) throw new AuctionError("Record missing", "NOT_FOUND");
    if (player.status !== "LIVE") throw new AuctionError("Player already processed", "DOUBLE_SELL");
    if (bid.amount !== a.currentBid || bid.teamId !== team.id) throw new AuctionError("Winning bid mismatch", "BID_MISMATCH");
    if (team.purse < bid.amount) throw new AuctionError("Team purse insufficient", "INSUFFICIENT_PURSE");
    if (team.squadCount >= s.maxSquadSize) throw new AuctionError("Squad full", "SQUAD_FULL");
    const existing = await tx.squadPlayer.findUnique({ where: { playerId: player.id } });
    if (existing) throw new AuctionError("Player already in a squad", "DOUBLE_SELL");

    await tx.squadPlayer.create({ data: { teamId: team.id, playerId: player.id, price: bid.amount } });
    const updatedTeam = await tx.team.update({ where: { id: team.id }, data: { purse: { decrement: bid.amount }, spent: { increment: bid.amount }, squadCount: { increment: 1 } } });
    if (updatedTeam.purse < 0) throw new AuctionError("Purse would go negative", "NEGATIVE_PURSE");
    await tx.player.update({ where: { id: player.id }, data: { status: "SOLD", soldPrice: bid.amount, soldToId: team.id, soldAt: new Date() } });
    const ev = await log("PLAYER_SOLD", { playerId: player.id, teamId: team.id, amount: bid.amount, payload: { bidId: bid.id } }, tx);
    await tx.auction.update({ where: { id: 1 }, data: { state: "SOLD", timerRunning: false, timerEndsAt: null, timerRemainingMs: null, version: { increment: 1 } } });
    await tx.notification.create({ data: { type: "PLAYER_SOLD", title: "SOLD!", message: `${player.name} sold to ${updatedTeam.name} for ₹${bid.amount}.` } });
    return { eventId: ev.id, playerName: player.name, teamName: updatedTeam.name, teamColor: updatedTeam.color, amount: bid.amount, teamId: team.id, playerId: player.id };
  });
  await broadcast("player:sold", result);
  await broadcast("team:purseUpdated", { teamId: result.teamId });
  emit("team:squadUpdated", { teamId: result.teamId });
  return result;
});

export const markUnsold = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE"], "mark unsold");
  if (!a.currentPlayerId) throw new AuctionError("No current player", "NO_PLAYER");
  if (a.currentBid > 0) throw new AuctionError("There is a valid bid — SELL instead", "HAS_BID");
  clearTimer();
  const p = await prisma.player.findUniqueOrThrow({ where: { id: a.currentPlayerId } });
  await prisma.$transaction([
    prisma.player.update({ where: { id: p.id }, data: { status: "UNSOLD" } }),
    prisma.auction.update({ where: { id: 1 }, data: { state: "UNSOLD", timerRunning: false, timerEndsAt: null, timerRemainingMs: null, version: { increment: 1 } } }),
    prisma.auctionEvent.create({ data: { type: "PLAYER_UNSOLD", playerId: p.id } }),
    prisma.notification.create({ data: { type: "PLAYER_UNSOLD", title: "Unsold", message: `${p.name} went unsold.` } }),
  ]);
  await broadcast("player:unsold", { playerName: p.name, basePrice: p.basePrice, playerId: p.id });
});

export const skipPlayer = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["PLAYER_LIVE"], "skip");
  if (!a.currentPlayerId) throw new AuctionError("No current player", "NO_PLAYER");
  if (a.currentBid > 0) throw new AuctionError("Cannot skip a player with bids", "HAS_BID");
  clearTimer();
  await prisma.$transaction([
    prisma.bid.deleteMany({ where: { playerId: a.currentPlayerId } }),
    prisma.player.update({ where: { id: a.currentPlayerId }, data: { status: "SKIPPED" } }),
    prisma.auction.update({ where: { id: 1 }, data: { state: "LIVE", currentPlayerId: null, currentBid: 0, highestTeamId: null, highestBidId: null, timerRunning: false, timerEndsAt: null, timerRemainingMs: null, version: { increment: 1 } } }),
    prisma.auctionEvent.create({ data: { type: "PLAYER_SKIPPED", playerId: a.currentPlayerId } }),
  ]);
  await broadcast("player:skipped", { playerId: a.currentPlayerId });
});

/** Clear the SOLD/UNSOLD result screen and go back to LIVE (ready for next player). */
export const nextPlayer = (autoStart = true) => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["SOLD", "UNSOLD", "LIVE"], "move to next player");
  await prisma.auction.update({ where: { id: 1 }, data: { state: "LIVE", currentPlayerId: null, currentBid: 0, highestTeamId: null, highestBidId: null, timerRunning: false, timerEndsAt: null, timerRemainingMs: null, version: { increment: 1 } } });
  await broadcast("player:next");
  if (autoStart) {
    const next = await pickNextPlayerId();
    if (next) { await startPlayerUnlocked(next); }
  }
});
async function startPlayerUnlocked(id: string) {
  await prisma.$transaction([
    prisma.player.update({ where: { id }, data: { status: "LIVE" } }),
    prisma.auction.update({ where: { id: 1 }, data: { state: "PLAYER_LIVE", currentPlayerId: id, currentBid: 0, highestTeamId: null, highestBidId: null, timerEndsAt: null, timerRemainingMs: null, timerRunning: false, version: { increment: 1 } } }),
  ]);
  await log("PLAYER_STARTED", { playerId: id });
  await broadcast("player:started", { playerId: id });
}

/** Undo the most recent SOLD/UNSOLD/SKIPPED event and put the player back as the live player. */
export const undoLast = () => withLock(async () => {
  const a = await getAuction();
  assertState(a.state, ["SOLD", "UNSOLD", "LIVE", "PLAYER_LIVE"], "undo");
  const ev = await prisma.auctionEvent.findFirst({ where: { undone: false, type: { in: ["PLAYER_SOLD", "PLAYER_UNSOLD", "PLAYER_SKIPPED"] } }, orderBy: { createdAt: "desc" } });
  if (!ev || !ev.playerId) throw new AuctionError("Nothing to undo", "NOTHING");
  if (a.state === "PLAYER_LIVE" && a.currentBid > 0) throw new AuctionError("Finish or skip the current player before undoing", "BUSY");
  clearTimer();
  await prisma.$transaction(async (tx) => {
    if (a.currentPlayerId && a.currentPlayerId !== ev.playerId) {
      await tx.bid.deleteMany({ where: { playerId: a.currentPlayerId } });
      await tx.player.update({ where: { id: a.currentPlayerId }, data: { status: "WAITING" } });
    }
    if (ev.type === "PLAYER_SOLD" && ev.teamId && ev.amount != null) {
      await tx.squadPlayer.deleteMany({ where: { playerId: ev.playerId! } });
      const t = await tx.team.update({ where: { id: ev.teamId }, data: { purse: { increment: ev.amount }, spent: { decrement: ev.amount }, squadCount: { decrement: 1 } } });
      if (t.squadCount < 0 || t.spent < 0) throw new AuctionError("Inconsistent undo", "INCONSISTENT");
    }
    await tx.player.update({ where: { id: ev.playerId! }, data: { status: "LIVE", soldPrice: null, soldToId: null, soldAt: null } });
    // Restore bid state from the last bid on this player (if any) so the auctioneer can re-decide.
    const lastBid = await tx.bid.findFirst({ where: { playerId: ev.playerId! }, orderBy: { amount: "desc" } });
    await tx.auction.update({ where: { id: 1 }, data: { state: "PLAYER_LIVE", currentPlayerId: ev.playerId, currentBid: lastBid?.amount ?? 0, highestTeamId: lastBid?.teamId ?? null, highestBidId: lastBid?.id ?? null, timerRunning: false, timerEndsAt: null, timerRemainingMs: null, version: { increment: 1 } } });
    await tx.auctionEvent.update({ where: { id: ev.id }, data: { undone: true } });
    await tx.auctionEvent.create({ data: { type: "UNDO", playerId: ev.playerId, teamId: ev.teamId, amount: ev.amount, payload: { undoneEventId: ev.id, undoneType: ev.type } } });
  });
  await broadcast("auction:undo", { undone: ev.type, playerId: ev.playerId });
});

/** Return an UNSOLD/SKIPPED player to the queue. */
export const requeuePlayer = (playerId: string) => withLock(async () => {
  const p = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (!["UNSOLD", "SKIPPED"].includes(p.status)) throw new AuctionError("Only unsold/skipped players can be re-queued", "BAD_PLAYER_STATE");
  const a = await getAuction();
  const max = await prisma.player.aggregate({ _max: { queueOrder: true } });
  await prisma.bid.deleteMany({ where: { playerId } });
  await prisma.player.update({ where: { id: playerId }, data: { status: a.state === "WAITING" ? "APPROVED" : "WAITING", queueOrder: (max._max.queueOrder ?? 0) + 1 } });
  await broadcast("state:sync");
});
