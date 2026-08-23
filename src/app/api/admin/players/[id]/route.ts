import { prisma } from "@/lib/prisma";
import { guard, parse, handle, json, audit } from "@/lib/api";
import { playerSchema } from "../route";
import { getSettings } from "@/server/auction-engine";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN", "AUCTIONEER"); if ("error" in g) return g.error;
  const { id } = await params;
  const p = await prisma.player.findUnique({ where: { id }, include: { bids: { include: { team: true }, orderBy: { createdAt: "desc" } }, soldTo: true } });
  return p ? json(p) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN"); if ("error" in g) return g.error;
  try {
    const { id } = await params;
    const data = await parse(req, playerSchema.partial());
    const current = await prisma.player.findUniqueOrThrow({ where: { id } });
    if (["LIVE", "SOLD"].includes(current.status) && data.status && data.status !== current.status) return json({ error: "Use auction controls to change a live/sold player" }, 409);
    if (data.status === "APPROVED" && current.status === "REGISTERED") {
      const s = await getSettings();
      const n = await prisma.player.count({ where: { status: { notIn: ["REGISTERED", "REJECTED"] } } });
      if (n >= s.maxPlayers) return json({ error: `Player pool is full (${s.maxPlayers})` }, 409);
      const auction = await prisma.auction.findUnique({ where: { id: 1 } });
      if (auction && auction.state !== "WAITING") data.status = "WAITING";
      await prisma.playerRegistration.updateMany({ where: { playerId: id }, data: { reviewedBy: g.session.user.id, reviewedAt: new Date() } });
      await prisma.notification.create({ data: { type: "REGISTRATION_APPROVED", title: "Registration approved", message: `${current.name} has been approved for the HPL auction.` } });
    }
    const p = await prisma.player.update({ where: { id }, data: { ...data, email: data.email === "" ? null : data.email } });
    await audit(g.session.user.id, "PLAYER_UPDATE", "Player", id, data);
    return json(p);
  } catch (e) { return handle(e); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN"); if ("error" in g) return g.error;
  try {
    const { id } = await params;
    const p = await prisma.player.findUniqueOrThrow({ where: { id } });
    if (["LIVE", "SOLD"].includes(p.status)) return json({ error: "Cannot delete a live or sold player" }, 409);
    await prisma.player.delete({ where: { id } });
    await audit(g.session.user.id, "PLAYER_DELETE", "Player", id);
    return json({ ok: true });
  } catch (e) { return handle(e); }
}
