"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuctionRoom } from "@/components/auction/AuctionRoom";
import { inr } from "@/lib/format";
import type { AuctionSnapshot } from "@/types/auction";
import { getSocket } from "@/lib/socket-client";
import { useToast } from "@/components/Toast";
import { useRef } from "react";

export function CaptainRoom({ initial, teamId }: { initial: AuctionSnapshot; teamId: string }) {
  const r = useRouter();
  const { push } = useToast();
  const wasHighest = useRef(false);
  useEffect(() => {
    const s = getSocket(); const f = () => r.refresh();
    const onBid = (p: { snapshot?: AuctionSnapshot }) => {
      const snap = p?.snapshot; if (!snap) return;
      const nowHighest = snap.highestTeamId === teamId;
      if (wasHighest.current && !nowHighest && snap.state === "PLAYER_LIVE") push({ title: "You've been outbid!", body: `${snap.teams.find((t) => t.id === snap.highestTeamId)?.name} is now highest`, tone: "error" });
      wasHighest.current = nowHighest;
    };
    s.on("player:sold", f); s.on("auction:undo", f); s.on("bid:accepted", onBid);
    return () => { s.off("player:sold", f); s.off("auction:undo", f); s.off("bid:accepted", onBid); };
  }, [r, teamId, push]);
  return (
    <AuctionRoom initial={initial} myTeamId={teamId} controls={() => (
      <div className="card flex items-center gap-3 p-4 text-sm text-muted">
        <span className="text-xl">🎙️</span>
        Bidding is run by the auctioneer — raise your hand in the room and your bid is recorded live. This page follows every bid, your purse and your squad in real time.
      </div>
    )} />
  );
}

