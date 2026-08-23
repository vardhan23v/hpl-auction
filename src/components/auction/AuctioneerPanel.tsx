"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import type { useAuction } from "@/hooks/useAuction";
import { inr } from "@/lib/format";

type A = ReturnType<typeof useAuction>;
type Q = { id: string; name: string; role: string; basePrice: number; status: string };

export function AuctioneerPanel({ a, isAdmin }: { a: A; isAdmin: boolean }) {
  const { push } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [queue, setQueue] = useState<Q[]>([]);
  const [pick, setPick] = useState("");
  const s = a.snap!;
  const loadQueue = () => fetch("/api/admin/players/queue").then((r) => r.json()).then((q) => Array.isArray(q) && setQueue(q)).catch(() => {});
  useEffect(() => { loadQueue(); }, [s.version]);

  async function act(action: string, confirmMsg?: string, playerId?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    const r = await fetch("/api/auction/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, playerId }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) push({ title: "Action failed", body: j.error, tone: "error" }); else push({ title: action.replace("_", " "), tone: "success" });
  }
  const B = ({ act: ac, label, cls = "btn-ghost", enabled, confirm }: { act: string; label: string; cls?: string; enabled: boolean; confirm?: string }) => (
    <button className={`${cls} w-full`} disabled={!enabled || !!busy} onClick={() => act(ac, confirm)}>{busy === ac ? "…" : label}</button>
  );
  const st = s.state;
  const highest = s.teams.find((t) => t.id === s.highestTeamId);
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="display text-lg">Auctioneer Console</h3><span className="rounded bg-panel-2 px-2 py-0.5 text-xs font-bold">{st}</span></div>
      {st === "WAITING" && <div className="mb-3 flex gap-2"><B act="START_AUCTION" label="▶ START AUCTION" cls="btn-green" enabled /></div>}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <div className="col-span-2 flex gap-1 md:col-span-2">
          <select className="input" value={pick} onChange={(e) => setPick(e.target.value)} disabled={!["LIVE", "SOLD", "UNSOLD"].includes(st)}>
            <option value="">Next in queue ({queue.length})</option>
            {queue.map((q) => <option key={q.id} value={q.id}>{q.name} · {inr(q.basePrice)}</option>)}
          </select>
          <button className="btn-gold whitespace-nowrap" disabled={!["LIVE", "SOLD", "UNSOLD"].includes(st) || !!busy} onClick={() => act("START_PLAYER", undefined, pick || undefined)}>START PLAYER</button>
        </div>
        <B act="SHUFFLE" label="🔀 SHUFFLE QUEUE" enabled={["WAITING", "LIVE", "SOLD", "UNSOLD", "PAUSED"].includes(st)} />
        <B act="START_TIMER" label="START TIMER" enabled={st === "PLAYER_LIVE" && !s.timerRunning} />
        <B act="RESET_TIMER" label="RESET TIMER" enabled={st === "PLAYER_LIVE" || st === "PAUSED"} />
        {st === "PAUSED" ? <B act="RESUME" label="RESUME" cls="btn-green" enabled /> : <B act="PAUSE" label="PAUSE" enabled={st === "LIVE" || st === "PLAYER_LIVE"} />}
        <B act="SELL" label={highest ? `SELL → ${highest.abbreviation}` : "SELL"} cls="btn-green" enabled={st === "PLAYER_LIVE" && s.currentBid > 0} confirm={`Sell ${s.currentPlayer?.name} to ${highest?.name} for ${inr(s.currentBid)}?`} />
        <B act="UNSOLD" label="UNSOLD" cls="btn-red" enabled={st === "PLAYER_LIVE" && s.currentBid === 0} confirm={`Mark ${s.currentPlayer?.name} UNSOLD?`} />
        <B act="SKIP" label="SKIP" enabled={st === "PLAYER_LIVE" && s.currentBid === 0} confirm="Skip this player?" />
        <B act="NEXT" label="NEXT PLAYER ▶" cls="btn-gold" enabled={st === "SOLD" || st === "UNSOLD" || (st === "LIVE" && !s.currentPlayer)} />
        <B act="UNDO" label="↩ UNDO LAST" enabled={["SOLD", "UNSOLD", "LIVE", "PLAYER_LIVE"].includes(st)} confirm="Undo the last SOLD/UNSOLD/SKIP action? This reverses the purse and squad changes." />
        {isAdmin && <B act="COMPLETE" label="■ COMPLETE AUCTION" cls="btn-red" enabled={["LIVE", "PAUSED", "SOLD", "UNSOLD"].includes(st)} confirm="Complete the auction? No further actions will be possible." />}
      </div>
      {s.state === "PLAYER_LIVE" && !s.timerRunning && a.remainingMs === 0 && s.currentBid > 0 && <div className="mt-3 rounded-lg bg-gold/15 px-3 py-2 text-sm text-gold">Timer expired — bidding closed. Choose SELL.</div>}
      {s.state === "PLAYER_LIVE" && !s.timerRunning && (s.timerRemainingMs == null || s.timerRemainingMs === s.timerSeconds * 1000) && <div className="mt-3 rounded-lg bg-panel-2 px-3 py-2 text-sm text-muted">Player is on the block. Press START TIMER to open bidding.</div>}
    </div>
  );
}
