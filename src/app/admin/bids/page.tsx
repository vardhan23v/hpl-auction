import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Bids() {
  const bids = await prisma.bid.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { team: true, player: { select: { name: true, status: true } }, user: { select: { name: true } } } });
  return (<div><h1 className="display text-4xl">Bids</h1>
    <div className="card mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-panel-2 text-left text-xs uppercase text-muted"><tr><th className="p-3">Time</th><th className="p-3">Player</th><th className="p-3">Team</th><th className="p-3">Captain</th><th className="p-3">Amount</th></tr></thead>
      <tbody>{bids.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">No bids yet.</td></tr>}{bids.map((b) => <tr key={b.id} className="border-t border-line/50"><td className="p-3 text-muted">{b.createdAt.toLocaleString()}</td><td className="p-3 font-semibold">{b.player.name}</td><td className="p-3" style={{ color: b.team.color }}>{b.team.name}</td><td className="p-3">{b.user?.name ?? "—"}</td><td className="money p-3 font-bold">{inr(b.amount)}</td></tr>)}</tbody></table></div></div>);
}
