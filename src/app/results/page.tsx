import { Nav } from "@/components/Nav";
import { TeamBadge } from "@/components/TeamBadge";
import { inr, ROLE_LABEL } from "@/lib/format";
import { getStats, getTeamsWithSquads } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Results() {
  const [st, { teams, settings }, auction] = await Promise.all([getStats(), getTeamsWithSquads(), prisma.auction.findUnique({ where: { id: 1 } })]);
  const complete = auction?.state === "COMPLETED";
  return (
    <>
      <Nav />
      <main className="stadium relative mx-auto max-w-7xl px-4 py-10">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">{complete ? "Final results" : "Results so far"}</div>
          <h1 className="display text-6xl md:text-8xl">HPL Auction {complete ? "Complete" : "In Progress"}</h1>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Players sold", st.sold], ["Players unsold", st.unsold], ["Total money spent", inr(st.totalSpent)], ["Highest bid", inr(st.highestBid)]].map(([l, v]) => <div key={String(l)} className="card p-5 text-center"><div className="display money text-3xl">{v}</div><div className="text-xs uppercase text-muted">{l}</div></div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="card p-6"><div className="label">Most expensive player</div>{st.mostExpensive ? <><div className="display text-4xl">{st.mostExpensive.name}</div><div className="money text-xl">{inr(st.mostExpensive.soldPrice)} · <span style={{ color: st.mostExpensive.soldTo?.color }}>{st.mostExpensive.soldTo?.name}</span></div></> : <div className="text-muted">—</div>}</div>
          <div className="card p-6"><div className="label">Highest spending team</div>{st.topSpender ? <><div className="display text-4xl" style={{ color: st.topSpender.color }}>{st.topSpender.name}</div><div className="money text-xl">{inr(st.topSpender.spent)} spent · {inr(st.topSpender.purse)} left</div></> : <div className="text-muted">—</div>}</div>
        </div>
        <h2 className="display mt-10 text-4xl">Final Squads</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="card overflow-hidden"><div className="h-1.5" style={{ background: t.color }} /><div className="p-4">
              <div className="flex items-center gap-3"><TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={44} /><div><div className="display text-2xl">{t.name}</div><div className="text-xs text-muted">{t.squadCount}/{settings.maxSquadSize} · purse left <span className="money">{inr(t.purse)}</span></div></div></div>
              <div className="mt-3 flex flex-col gap-1 text-sm"><div className="flex justify-between"><span>{t.captainName ?? "TBA"} <span className="text-[10px] font-bold text-gold">C</span></span><span className="text-xs text-muted">captain</span></div>{t.squad.map((s) => <div key={s.id} className="flex justify-between"><span>{s.player.name} <span className="text-xs text-muted">{ROLE_LABEL[s.player.role]}</span></span><span className="money">{inr(s.price)}</span></div>)}{t.squad.length === 0 && <div className="text-muted">No players</div>}</div>
            </div></div>
          ))}
        </div>
      </main>
    </>
  );
}
