import { Nav } from "@/components/Nav";
import { getStats } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/format";
import { Charts } from "./Charts";
export const dynamic = "force-dynamic";
export default async function Analytics() {
  const st = await getStats();
  const [roles, squads, bidsByTeam, prices] = await Promise.all([
    prisma.player.groupBy({ by: ["role"], _count: { _all: true }, where: { status: { notIn: ["REGISTERED", "REJECTED"] } } }),
    prisma.squadPlayer.findMany({ include: { player: { select: { role: true } }, team: { select: { name: true } } } }),
    prisma.bid.groupBy({ by: ["teamId"], _count: { _all: true } }),
    prisma.player.findMany({ where: { status: "SOLD" }, select: { name: true, soldPrice: true }, orderBy: { soldPrice: "desc" }, take: 15 }),
  ]);
  const tiles = [["Total players", st.totalPlayers], ["Sold", st.sold], ["Unsold", st.unsold], ["Money spent", inr(st.totalSpent)], ["Average price", inr(st.avgPrice)], ["Highest bid", inr(st.highestBid)], ["Lowest sale", inr(st.lowestBid)], ["Top spender", st.topSpender?.name ?? "—"], ["Most expensive", st.mostExpensive ? `${st.mostExpensive.name} (${inr(st.mostExpensive.soldPrice)})` : "—"], ["Most active team", st.mostActive ? `${st.mostActive.name} (${st.mostActive.bids} bids)` : "—"]];
  const data = {
    teams: st.teams.map((t) => ({ name: t.abbreviation, color: t.color, spent: t.spent, purse: t.purse, bids: bidsByTeam.find((b) => b.teamId === t.id)?._count._all ?? 0 })),
    roles: roles.map((r) => ({ name: r.role, value: r._count._all })),
    squads: st.teams.map((t) => { const s = squads.filter((x) => x.team.name === t.name); return { name: t.abbreviation, BATSMAN: s.filter((x) => x.player.role === "BATSMAN").length, BOWLER: s.filter((x) => x.player.role === "BOWLER").length, ALL_ROUNDER: s.filter((x) => x.player.role === "ALL_ROUNDER").length, WICKETKEEPER: s.filter((x) => x.player.role === "WICKETKEEPER").length }; }),
    prices: prices.map((p) => ({ name: p.name, price: p.soldPrice ?? 0 })),
  };
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="display text-5xl">Analytics</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">{tiles.map(([l, v]) => <div key={String(l)} className="card p-4"><div className="text-[11px] uppercase tracking-wider text-muted">{l}</div><div className="display mt-1 truncate text-2xl text-gold">{v}</div></div>)}</div>
        <Charts data={data} />
      </main>
    </>
  );
}
