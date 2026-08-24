import Link from "next/link";
import { Nav } from "@/components/Nav";
import { TeamBadge } from "@/components/TeamBadge";
import { inr, ROLE_LABEL } from "@/lib/format";
import { getStats, getTeamsWithSquads } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const metadata = { title: "Final Teams" };
const ORDER = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];

export default async function Results() {
  const [st, { teams, settings }, auction] = await Promise.all([getStats(), getTeamsWithSquads(), prisma.auction.findUnique({ where: { id: 1 } })]);
  const complete = auction?.state === "COMPLETED";
  return (
    <>
      <Nav />
      <main className="stadium relative mx-auto max-w-7xl px-4 py-10">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">{complete ? "The gavel has fallen" : "Results so far"}</div>
          <h1 className="display text-6xl md:text-8xl">{complete ? "HPL Auction Complete" : "HPL Auction In Progress"}</h1>
          {complete && <p className="mx-auto mt-3 max-w-xl text-muted">Six squads finalized. {st.sold} players found their price. Here are the teams that will battle for the HPL title.</p>}
          {!complete && <p className="mt-3 text-muted">The auction is still running — <Link className="text-gold underline" href="/live">watch it live</Link>. Squads below update in real time.</p>}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Players sold", st.sold], ["Players unsold", st.unsold], ["Total money spent", inr(st.totalSpent)], ["Highest bid", inr(st.highestBid)]].map(([l, v]) => <div key={String(l)} className="card p-5 text-center"><div className="display money text-3xl">{v}</div><div className="text-xs uppercase text-muted">{l}</div></div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="card p-6"><div className="label">Most expensive player</div>{st.mostExpensive ? <><div className="display text-4xl">{st.mostExpensive.name}</div><div className="money text-xl">{inr(st.mostExpensive.soldPrice)} · <span style={{ color: st.mostExpensive.soldTo?.color }}>{st.mostExpensive.soldTo?.name}</span></div></> : <div className="text-muted">—</div>}</div>
          <div className="card p-6"><div className="label">Highest spending team</div>{st.topSpender ? <><div className="display text-4xl" style={{ color: st.topSpender.color }}>{st.topSpender.name}</div><div className="money text-xl">{inr(st.topSpender.spent)} spent · {inr(st.topSpender.purse)} left</div></> : <div className="text-muted">—</div>}</div>
        </div>

        <h2 className="display mt-12 text-center text-5xl">{complete ? "The Final Six" : "Squads"}</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {teams.map((t) => {
            const prices = t.squad.map((s) => s.price);
            const top = prices.length ? Math.max(...prices) : 0;
            return (
              <div key={t.id} className="card reveal overflow-hidden">
                <div className="h-2" style={{ background: t.color }} />
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="display truncate text-3xl">{t.name}</div>
                      <div className="text-sm text-muted">Captain: <b className="text-ink">{t.captainName ?? "TBA"}</b></div>
                    </div>
                    <div className="text-right"><div className="display text-2xl">{t.squadCount}/{settings.maxSquadSize}</div><div className="text-[11px] uppercase text-muted">squad</div></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted">
                    {[["Spent", inr(t.spent)], ["Purse left", inr(t.purse)], ["Top buy", inr(top)]].map(([l, v]) => <div key={l} className="rounded-lg bg-panel-2 p-2"><div className="text-base font-bold text-ink">{v}</div>{l}</div>)}
                  </div>
                  <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2">
                    <div className="flex items-center justify-between text-sm"><span className="font-bold">{t.captainName ?? "TBA"} <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">CAPTAIN</span></span><span className="text-xs text-muted">slot 1</span></div>
                  </div>
                  {ORDER.map((role) => {
                    const list = t.squad.filter((s) => s.player.role === role);
                    if (!list.length) return null;
                    return (
                      <div key={role} className="mt-3">
                        <div className="label">{ROLE_LABEL[role]}s ({list.length})</div>
                        {list.map((s) => (
                          <div key={s.id} className="flex items-center justify-between border-b border-line/40 py-1.5 text-sm last:border-0">
                            <span className="flex min-w-0 items-center gap-2">
                              {s.player.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.player.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel-2 text-[10px]">{s.player.name[0]}</span>}
                              <span className="truncate">{s.player.name}</span>
                            </span>
                            <span className="money font-semibold">{inr(s.price)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {t.squad.length === 0 && <div className="mt-3 py-4 text-center text-sm text-muted">No players bought{complete ? "" : " yet"}.</div>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
