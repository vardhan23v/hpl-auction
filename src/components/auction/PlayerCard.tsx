"use client";
import { useEffect, useRef, useState } from "react";
import { inr, ROLE_LABEL } from "@/lib/format";
import type { AuctionSnapshot } from "@/types/auction";
import { Timer } from "./Timer";

export function PlayerCard({ snap, remainingMs }: { snap: AuctionSnapshot; remainingMs: number }) {
  const p = snap.currentPlayer;
  const prevBid = useRef(snap.currentBid);
  const [bump, setBump] = useState(0);
  useEffect(() => { if (snap.currentBid !== prevBid.current) { prevBid.current = snap.currentBid; setBump((b) => b + 1); } }, [snap.currentBid]);
  const highest = snap.teams.find((t) => t.id === snap.highestTeamId);

  if (!p) {
    if (snap.state === "COMPLETED") {
      return (
        <div className="card flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
          <div className="display text-5xl text-gold">HPL Auction Complete</div>
          <div className="mt-2 text-muted">All squads are finalized.</div>
          <a href="/results" className="btn-gold mt-6 !px-6 !py-3 text-base">View the final teams →</a>
        </div>
      );
    }
    return (
      <div className="card sheen relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-8 text-center">
        <div className="orb" style={{ left: "8%", top: "18%", width: 190, height: 190, background: "rgba(245,184,46,.16)" }} />
        <div className="orb" style={{ right: "6%", bottom: "10%", width: 240, height: 240, background: "rgba(255,46,77,.10)", animationDelay: "2.5s" }} />
        {[12, 30, 52, 70, 88].map((x, i) => <span key={x} className="ember" style={{ left: `${x}%`, animationDelay: `${i * 1.1}s` }} />)}
        <div className="relative mb-6 h-28 w-28">
          <svg viewBox="0 0 100 100" className="ring absolute inset-0 h-full w-full"><circle cx="50" cy="50" r="46" fill="none" stroke="#f5b82e" strokeWidth="2" strokeDasharray="10 14" opacity=".6" /></svg>
          <div className="floaty absolute inset-3 flex items-center justify-center rounded-full border border-gold/40 bg-panel-2"><span className="display text-3xl font-bold text-gold">HPL</span></div>
        </div>
        <div className={`display text-5xl md:text-6xl ${snap.state === "WAITING" ? "gold-text" : ""}`}>{snap.state === "WAITING" ? "HPL Season 4" : snap.state === "PAUSED" ? "Auction Paused" : "Next Player Coming Up"}</div>
        <div className="mt-2 text-sm text-muted">
          {snap.state === "WAITING" ? "Auction starts soon — get ready to bid" : snap.state === "PAUSED" ? "Hold tight — bidding resumes shortly" : "Shuffling the deck"}
          <span className="dot1">.</span><span className="dot2">.</span><span className="dot3">.</span>
        </div>
        <div className="mt-6 flex gap-6 text-center">
          <div><div className="display text-2xl text-gold">{snap.playersRemaining}</div><div className="text-[10px] uppercase tracking-wider text-muted">Remaining</div></div>
          <div><div className="display text-2xl text-emerald-400">{snap.soldCount}</div><div className="text-[10px] uppercase tracking-wider text-muted">Sold</div></div>
          <div><div className="display text-2xl text-live">{snap.unsoldCount}</div><div className="text-[10px] uppercase tracking-wider text-muted">Unsold</div></div>
        </div>
      </div>
    );
  }
  return (
    <div key={p.id} className="card reveal sheen relative overflow-hidden p-5 md:p-7">
      {snap.state === "PAUSED" && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="display text-4xl font-bold text-gold">PAUSED</div></div>}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="mx-auto h-56 w-56 overflow-hidden rounded-2xl border border-line bg-panel-2 md:h-auto md:w-full">
          {p.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" /> : <div className="display flex h-full w-full items-center justify-center text-7xl text-muted/40">{p.name[0]}</div>}
        </div>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">Now on the block</div>
              <h2 className="display text-4xl font-bold leading-none md:text-5xl">{p.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-panel-2 px-2 py-1 font-semibold">{ROLE_LABEL[p.role]}</span>
                {p.battingStyle && <span className="rounded-md bg-panel-2 px-2 py-1">{p.battingStyle}</span>}
                {p.bowlingStyle && <span className="rounded-md bg-panel-2 px-2 py-1">{p.bowlingStyle}</span>}
                {p.age && <span className="rounded-md bg-panel-2 px-2 py-1">Age {p.age}</span>}
                {p.hostelBlock && <span className="rounded-md bg-panel-2 px-2 py-1">Block {p.hostelBlock}</span>}
              </div>
            </div>
            {snap.timerRunning && <Timer ms={remainingMs} running total={snap.timerSeconds} />}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted">
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-lg font-bold text-ink">{p.matches}</div>Matches</div>
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-lg font-bold text-ink">{p.runs}</div>Runs</div>
            <div className="rounded-lg bg-panel-2 p-2"><div className="text-lg font-bold text-ink">{p.wickets}</div>Wickets</div>
          </div>
          <div className="mt-auto grid grid-cols-[1fr_2fr] items-end gap-4 pt-5">
            <div>
              <div className="label">Base price</div>
              <div className="display text-2xl">{inr(p.basePrice)}</div>
            </div>
            <div className="text-right">
              <div className="label">Current bid</div>
              <div key={bump} className={`display money text-5xl font-bold leading-none md:text-7xl ${bump ? "bump" : ""} ${snap.currentBid > 0 ? "bid-glow" : ""}`}>{snap.currentBid > 0 ? inr(snap.currentBid) : "—"}</div>
              <div className="mt-1 text-sm">
                {highest ? <span className="font-bold uppercase tracking-wider" style={{ color: highest.color }}>{highest.name}</span> : <span className="text-muted">No bids yet</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
