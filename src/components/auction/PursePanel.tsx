import { inr } from "@/lib/format";
import type { TeamSnapshot } from "@/types/auction";
import { TeamBadge } from "../TeamBadge";
export function PursePanel({ teams, highlight, mine }: { teams: TeamSnapshot[]; highlight?: string | null; mine?: string | null }) {
  return (
    <div className="card p-4">
      <h3 className="display mb-3 text-lg">Team Purses</h3>
      <div className="flex flex-col gap-2">
        {teams.map((t) => {
          const left = t.maxSquad - t.squadCount;
          const pct = t.purse / (t.purse + t.spent || 1);
          return (
            <div key={t.id} className={`rounded-lg border p-2.5 transition ${highlight === t.id ? "border-gold bg-gold/10" : "border-line bg-panel-2"} ${mine === t.id ? "ring-1 ring-sky-400/60" : ""}`}>
              <div className="flex items-center gap-3">
                <TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between"><span className="truncate text-sm font-semibold">{t.name}</span><span className="money text-sm font-bold tabular-nums">{inr(t.purse)}</span></div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Spent {inr(t.spent)}</span>
                    <span className={left === 0 ? "font-bold text-live" : left === 1 ? "font-bold text-gold" : ""}>{left === 0 ? "SQUAD FULL" : left === 1 ? "1 SLOT REMAINING" : `${t.squadCount}/${t.maxSquad}`}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded bg-line"><div className="h-full transition-all" style={{ width: `${pct * 100}%`, background: t.color }} /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
