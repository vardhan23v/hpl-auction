"use client";
import Link from "next/link";
import { useAuction } from "@/hooks/useAuction";
import { inr, ROLE_LABEL } from "@/lib/format";
import { Timer } from "./auction/Timer";
export function LivePreview() {
  const { snap, remainingMs } = useAuction();
  if (!snap) return <div className="card p-8 text-center text-muted">Connecting…</div>;
  const p = snap.currentPlayer; const h = snap.teams.find((t) => t.id === snap.highestTeamId);
  return (
    <Link href="/live" className="card block p-6 transition hover:border-gold/50">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 font-bold"><span className={`h-2.5 w-2.5 rounded-full ${p ? "live-dot bg-live" : "bg-muted"}`} />{snap.state.replace("_", " ")}</div>
        {p ? (<>
          <div><div className="label">Player</div><div className="display text-2xl">{p.name}</div><div className="text-xs text-muted">{ROLE_LABEL[p.role]}</div></div>
          <div><div className="label">Current bid</div><div className="display money text-3xl">{snap.currentBid ? inr(snap.currentBid) : "—"}</div></div>
          <div><div className="label">Highest bidder</div><div className="font-bold" style={{ color: h?.color }}>{h?.name ?? "—"}</div></div>
          <div className="ml-auto"><Timer ms={remainingMs} running={snap.timerRunning} total={snap.timerSeconds} size="sm" /></div>
        </>) : <div className="text-muted">{snap.state === "WAITING" ? "The auction hasn't started yet. Check back soon." : snap.state === "COMPLETED" ? "The auction is complete — see the results." : "Between players…"}</div>}
      </div>
    </Link>
  );
}
