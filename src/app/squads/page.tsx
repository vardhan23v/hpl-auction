import { Nav } from "@/components/Nav";
import { TeamBadge } from "@/components/TeamBadge";
import { inr, ROLE_LABEL } from "@/lib/format";
import { getTeamsWithSquads } from "@/lib/queries";
export const dynamic = "force-dynamic";
const ORDER = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];
export default async function Squads() {
  const { teams, settings } = await getTeamsWithSquads();
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="display text-5xl">Team Squads</h1>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {teams.map((t) => {
            const prices = t.squad.map((s) => s.price);
            const max = prices.length ? Math.max(...prices) : 0; const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
            return (
              <section id={t.id} key={t.id} className="card scroll-mt-20 overflow-hidden">
                <div className="h-1.5" style={{ background: t.color }} />
                <div className="p-5">
                  <div className="flex items-center gap-4"><TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={56} /><div><div className="display text-3xl">{t.name}</div><div className="text-sm text-muted">Captain: {t.captainName ?? "TBA"}</div></div></div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted sm:grid-cols-5">
                    {[["Purse left", inr(t.purse)], ["Spent", inr(t.spent)], ["Squad", `${t.squadCount}/${settings.maxSquadSize}`], ["Highest buy", inr(max)], ["Avg buy", inr(avg)]].map(([l, v]) => <div key={l} className="rounded-lg bg-panel-2 p-2"><div className="font-bold text-ink">{v}</div>{l}</div>)}
                  </div>
                  <div className="mt-4"><div className="label">Captain</div>
                    <div className="flex items-center justify-between border-b border-line/50 py-1.5 text-sm last:border-0"><span>{t.captainName ?? "TBA"} <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">C</span></span><span className="text-xs text-muted">slot 1</span></div>
                  </div>
                  {ORDER.map((role) => { const list = t.squad.filter((s) => s.player.role === role); if (!list.length) return null; return (
                    <div key={role} className="mt-4"><div className="label">{ROLE_LABEL[role]}s</div>
                      {list.map((s) => <div key={s.id} className="flex items-center justify-between border-b border-line/50 py-1.5 text-sm last:border-0"><span>{s.player.name}</span><span className="money font-semibold">{inr(s.price)}</span></div>)}
                    </div>); })}
                  {t.squad.length === 0 && <div className="mt-4 text-center text-sm text-muted">No players yet.</div>}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
