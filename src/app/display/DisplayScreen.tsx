"use client";
/** Fullscreen broadcast view for the projector / big screen on auction night. */
import { useEffect, useState } from "react";
import { useAuction } from "@/hooks/useAuction";
import { inr, ROLE_LABEL, mmss } from "@/lib/format";
import { TeamBadge } from "@/components/TeamBadge";
import type { AuctionSnapshot } from "@/types/auction";

export function DisplayScreen({ initial }: { initial: AuctionSnapshot }) {
  const a = useAuction(initial);
  const [clock, setClock] = useState("");
  useEffect(() => { const t = setInterval(() => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000); return () => clearInterval(t); }, []);
  if (!a.snap) return null;
  const s = a.snap;
  const p = s.currentPlayer;
  const highest = s.teams.find((t) => t.id === s.highestTeamId);
  const sec = Math.ceil(a.remainingMs / 1000);
  const live = ["LIVE", "PLAYER_LIVE", "SOLD", "UNSOLD"].includes(s.state);

  return (
    <div className="stadium fixed inset-0 flex flex-col overflow-hidden bg-pitch">
      {/* SOLD / UNSOLD takeover */}
      {a.flash && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur">
          <div className={`stamp display rounded-3xl border-[10px] px-16 py-6 text-[16vh] font-bold leading-none ${a.flash.kind === "SOLD" ? "border-emerald-400 text-emerald-400" : "border-live text-live"}`} style={{ textShadow: "0 0 60px currentColor" }}>{a.flash.kind === "SOLD" ? "SOLD!" : "UNSOLD"}</div>
          <div className="display mt-10 text-[7vh] leading-none">{a.flash.playerName}</div>
          {a.flash.kind === "SOLD" && (<><div className="display mt-4 text-[5vh] leading-none" style={{ color: a.flash.teamColor }}>{a.flash.teamName}</div><div className="display money mt-6 text-[12vh] font-bold leading-none">{inr(a.flash.amount)}</div></>)}
        </div>
      )}

      {/* Header */}
      <header className="glass z-10 flex items-center gap-6 px-8 py-4">
        <div className="display text-4xl font-bold tracking-widest"><span className="text-gold">HPL</span> HOSTEL PREMIER LEAGUE</div>
        <div className="flex items-center gap-3 text-2xl font-bold">{live && <span className="live-dot inline-block h-4 w-4 rounded-full bg-live" />}{s.state === "PLAYER_LIVE" ? "LIVE" : s.state.replace("_", " ")}</div>
        <div className="ml-auto flex items-center gap-8 text-xl text-muted">
          <span>Players left <b className="text-ink">{s.playersRemaining}</b></span>
          <span className={a.connected ? "text-emerald-400" : "text-live"}>●</span>
          <span className="tabular-nums">{clock}</span>
        </div>
      </header>

      {/* Main */}
      {p ? (
        <main className="grid min-h-0 flex-1 grid-cols-[1fr_1.4fr] gap-8 p-8">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-panel-2">
            {p.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" /> : <div className="display flex h-full items-center justify-center text-[30vh] text-muted/30">{p.name[0]}</div>}
            {s.state === "PAUSED" && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><span className="display text-[8vh] text-gold">PAUSED</span></div>}
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="display text-2xl tracking-[.3em] text-gold">NOW ON THE BLOCK</div>
                <h1 className="display mt-1 text-[9vh] font-bold leading-[.95]">{p.name}</h1>
                <div className="mt-3 flex gap-3 text-2xl text-muted"><span className="rounded-xl bg-panel-2 px-4 py-1 font-semibold text-ink">{ROLE_LABEL[p.role]}</span>{p.battingStyle && <span className="rounded-xl bg-panel-2 px-4 py-1">{p.battingStyle}</span>}{p.bowlingStyle && <span className="rounded-xl bg-panel-2 px-4 py-1">{p.bowlingStyle}</span>}</div>
              </div>
              <div className={`display rounded-2xl border-4 px-8 py-4 text-[8vh] font-bold leading-none tabular-nums ${sec <= 5 && s.timerRunning ? "border-live text-live" : "border-line text-ink"} ${!s.timerRunning ? "opacity-40" : ""}`}>{mmss(a.remainingMs)}</div>
            </div>
            <div className="mt-auto">
              <div className="flex items-end justify-between">
                <div><div className="display text-2xl text-muted">BASE PRICE</div><div className="display text-[5vh]">{inr(p.basePrice)}</div></div>
                <div className="text-right">
                  <div className="display text-2xl text-muted">CURRENT BID</div>
                  <div className="display money text-[16vh] font-bold leading-none">{s.currentBid > 0 ? inr(s.currentBid) : "—"}</div>
                  <div className="display mt-2 text-[4.5vh] leading-none">{highest ? <span style={{ color: highest.color }}>{highest.name}</span> : <span className="text-muted">Awaiting first bid</span>}</div>
                </div>
              </div>
              {/* bid ticker */}
              <div className="mt-6 flex gap-3 overflow-hidden">
                {s.bids.slice(0, 6).map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-5 py-3 text-2xl ${i === 0 ? "bid-new bg-gold/15 ring-2 ring-gold/50" : "bg-panel-2"}`}>
                    <span className="h-4 w-4 rounded-full" style={{ background: b.color }} /><span className="font-semibold">{b.teamName}</span><span className="money font-bold">{inr(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="display text-[10vh] text-muted">{s.state === "WAITING" ? "AUCTION STARTS SOON" : s.state === "COMPLETED" ? "AUCTION COMPLETE" : s.state === "PAUSED" ? "PAUSED" : "NEXT PLAYER COMING UP"}</div>
          <div className="mt-4 text-3xl text-muted">{s.soldCount} sold · {s.unsoldCount} unsold · {s.playersRemaining} remaining</div>
          {s.state === "COMPLETED" && <div className="display mt-8 text-4xl text-gold">Final teams → /results</div>}
        </main>
      )}

      {/* Purse strip */}
      <footer className="z-10 grid grid-cols-6 gap-3 border-t border-line/60 bg-panel/80 px-6 py-4">
        {s.teams.map((t) => {
          const left = t.maxSquad - t.squadCount;
          return (
            <div key={t.id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.highestTeamId === t.id ? "border-gold bg-gold/10" : "border-line bg-panel-2"}`}>
              <TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={44} />
              <div className="min-w-0">
                <div className="truncate text-lg font-bold leading-tight">{t.abbreviation}</div>
                <div className="money text-xl font-bold leading-tight tabular-nums">{inr(t.purse)}</div>
                <div className={`text-sm ${left === 0 ? "font-bold text-live" : "text-muted"}`}>{left === 0 ? "FULL" : `${t.squadCount}/${t.maxSquad}`}</div>
              </div>
            </div>
          );
        })}
      </footer>
    </div>
  );
}
