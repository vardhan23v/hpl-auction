"use client";
import { useEffect } from "react";
import { useAuction } from "@/hooks/useAuction";
import { useToast } from "@/components/Toast";
import { LiveHeader } from "./LiveHeader";
import { PlayerCard } from "./PlayerCard";
import { BidFeed } from "./BidFeed";
import { PursePanel } from "./PursePanel";
import { ResultOverlay } from "./ResultOverlay";
import { RecentResults } from "./RecentResults";
import type { AuctionSnapshot } from "@/types/auction";
import type { ReactNode } from "react";

/** Shared room layout. `controls` renders under the player card (bid button / auctioneer panel). */
export function AuctionRoom({ initial, myTeamId, controls }: { initial: AuctionSnapshot | null; myTeamId?: string | null; controls?: (a: ReturnType<typeof useAuction>) => ReactNode }) {
  const a = useAuction(initial);
  const { push } = useToast();
  useEffect(() => { if (a.lastRejection) { push({ title: "Bid rejected", body: a.lastRejection, tone: "error" }); a.clearRejection(); } }, [a.lastRejection]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (a.flash) push({ title: a.flash.kind === "SOLD" ? `SOLD: ${a.flash.playerName}` : `UNSOLD: ${a.flash.playerName}`, body: a.flash.teamName, tone: a.flash.kind === "SOLD" ? "success" : "error" }); }, [a.flash]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!a.snap) return <div className="p-10 text-center text-muted">Connecting to auction…</div>;
  const s = a.snap;
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 px-3 py-4 md:px-4">
      <ResultOverlay flash={a.flash} />
      <LiveHeader snap={s} connected={a.connected} clients={a.clients} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <PlayerCard snap={s} remainingMs={a.remainingMs} />
          {controls?.(a)}
          <div className="grid gap-4 md:grid-cols-2">
            <BidFeed bids={s.bids} />
            <div className="lg:hidden"><PursePanel teams={s.teams} highlight={s.highestTeamId} mine={myTeamId} /></div>
            <RecentResults />
          </div>
        </div>
        <div className="hidden lg:block"><PursePanel teams={s.teams} highlight={s.highestTeamId} mine={myTeamId} /></div>
      </div>
    </div>
  );
}
