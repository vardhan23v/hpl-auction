"use client";
import { useEffect, useState } from "react";
import { inr, ROLE_LABEL } from "@/lib/format";
import type { TeamSnapshot } from "@/types/auction";
import { TeamBadge } from "../TeamBadge";

type Squad = { captainName: string | null; squad: { id: string; price: number; player: { name: string; role: string; photoUrl: string | null } }[] };

export function PursePanel({ teams, highlight, mine }: { teams: TeamSnapshot[]; highlight?: string | null; mine?: string | null }) {
  const [open, setOpen] = useState<string | null>(null);
  const [squads, setSquads] = useState<Record<string, Squad>>({});
  const load = (id: string) => fetch(`/api/public/squad/${id}`).then((r) => r.json()).then((d) => setSquads((s) => ({ ...s, [id]: d }))).catch(() => {});
  useEffect(() => { if (open) load(open); }, [open, teams]); // re-fetch when snapshot changes (a sale updates `teams`)
  return (
    <div className="card p-4">
      <h3 className="display mb-1 text-lg">Team Purses</h3>
      <div className="mb-2 text-[11px] text-muted">Tap a team to see its squad</div>
      <div className="flex flex-col gap-2">
        {teams.map((t) => {
          const left = t.maxSquad - t.squadCount;
          const pct = t.purse / (t.purse + t.spent || 1);
          const isOpen = open === t.id;
          const sq = squads[t.id];
          return (
            <div key={t.id} className={`team-row rounded-lg border ${highlight === t.id ? "border-gold bg-gold/10" : "border-line bg-panel-2"} ${mine === t.id ? "ring-1 ring-sky-400/60" : ""}`}>
              <button className="w-full p-2.5 text-left" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                <div className="flex items-center gap-3">
                  <TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between"><span className="truncate text-sm font-semibold">{t.name}</span><span className="money text-sm font-bold tabular-nums">{inr(t.purse)}</span></div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>Spent {inr(t.spent)}</span>
                      <span className={left === 0 ? "font-bold text-live" : left === 1 ? "font-bold text-gold" : ""}>{left === 0 ? "SQUAD FULL" : left === 1 ? "1 SLOT REMAINING" : `${t.squadCount}/${t.maxSquad}`}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded bg-line"><div className="bar-anim h-full transition-all" style={{ width: `${pct * 100}%`, background: t.color }} /></div>
                  </div>
                  <span className={`text-xs text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-line/60 px-3 py-2">
                  <div className="flex items-center justify-between py-1 text-sm">
                    <span className="font-semibold">{sq?.captainName ?? t.captainName ?? "TBA"} <span className="rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold text-gold">C</span></span>
                    <span className="text-[11px] text-muted">captain</span>
                  </div>
                  {!sq && <div className="py-2 text-center text-xs text-muted">Loading…</div>}
                  {sq?.squad.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between border-t border-line/40 py-1 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        {sp.player.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={sp.player.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-panel text-[9px]">{sp.player.name[0]}</span>}
                        <span className="truncate">{sp.player.name}</span>
                        <span className="shrink-0 text-[10px] text-muted">{ROLE_LABEL[sp.player.role]}</span>
                      </span>
                      <span className="money text-xs font-bold">{inr(sp.price)}</span>
                    </div>
                  ))}
                  {sq && sq.squad.length === 0 && <div className="border-t border-line/40 py-2 text-center text-xs text-muted">No players bought yet</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
