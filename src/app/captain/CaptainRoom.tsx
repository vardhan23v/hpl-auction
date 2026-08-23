"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuctionRoom } from "@/components/auction/AuctionRoom";
import { inr } from "@/lib/format";
import type { AuctionSnapshot } from "@/types/auction";
import { getSocket } from "@/lib/socket-client";

export function CaptainRoom({ initial, teamId }: { initial: AuctionSnapshot; teamId: string }) {
  const r = useRouter();
  useEffect(() => { const s = getSocket(); const f = () => r.refresh(); s.on("player:sold", f); s.on("auction:undo", f); return () => { s.off("player:sold", f); s.off("auction:undo", f); }; }, [r]);
  return (
    <AuctionRoom initial={initial} myTeamId={teamId} controls={(a) => <BidControls a={a} teamId={teamId} />} />
  );
}

function BidControls({ a, teamId }: { a: Parameters<NonNullable<Parameters<typeof AuctionRoom>[0]["controls"]>>[0]; teamId: string }) {
  const [busy, setBusy] = useState(false); const [custom, setCustom] = useState("");
  const s = a.snap!; const me = s.teams.find((t) => t.id === teamId);
  const canBid = s.state === "PLAYER_LIVE" && s.timerRunning && a.remainingMs > 0 && !!me && me.squadCount < me.maxSquad && a.nextBid <= me.purse && s.highestTeamId !== teamId;
  const reason = s.state === "PAUSED" ? "Auction paused" : s.state !== "PLAYER_LIVE" ? "No player live" : !s.timerRunning ? "Waiting for the timer" : a.remainingMs <= 0 ? "Bidding closed" : me && me.squadCount >= me.maxSquad ? "SQUAD FULL" : me && a.nextBid > me.purse ? "Insufficient purse" : s.highestTeamId === teamId ? "You are the highest bidder" : null;
  const bid = async (amt?: number) => { setBusy(true); await a.placeBid(amt); setBusy(false); setCustom(""); };
  const inc = s.bidIncrement;
  return (
    <div className="card sticky bottom-2 z-30 p-4" style={{ borderColor: me?.color }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto"><div className="label">Your purse</div><div className="display money text-2xl">{inr(me?.purse)}</div><div className="text-xs text-muted">Squad {me?.squadCount}/{me?.maxSquad}</div></div>
        {[inc, inc * 2, inc * 5].map((step) => {
          const amt = s.currentBid === 0 ? (s.currentPlayer?.basePrice ?? 0) + (step - inc) : s.currentBid + step;
          return <button key={step} className="btn-ghost" disabled={!canBid || busy || amt > (me?.purse ?? 0)} onClick={() => bid(amt)}>+{inr(step)}</button>;
        })}
        <div className="flex items-center gap-1"><input className="input w-32" placeholder="Custom ₹" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} /><button className="btn-ghost" disabled={!canBid || busy || !custom} onClick={() => bid(Number(custom))}>Bid</button></div>
        <button className="btn-gold display !px-8 !py-4 !text-2xl" disabled={!canBid || busy} onClick={() => bid()}>
          {reason ? reason : `BID ${inr(a.nextBid)}`}
        </button>
      </div>
    </div>
  );
}
