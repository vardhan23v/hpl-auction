"use client";
import { inr } from "@/lib/format";
import type { FlashEvent } from "@/hooks/useAuction";
export function ResultOverlay({ flash }: { flash: FlashEvent | null }) {
  if (!flash) return null;
  const sold = flash.kind === "SOLD";
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="pop text-center">
        <div className={`stamp display inline-block rounded-2xl border-8 px-10 py-4 text-7xl font-bold md:text-9xl ${sold ? "border-emerald-400 text-emerald-400" : "border-live text-live"}`} style={{ textShadow: "0 0 40px currentColor" }}>{sold ? "SOLD!" : "UNSOLD"}</div>
        <div className="display mt-8 text-4xl md:text-5xl">{flash.playerName}</div>
        {sold ? (
          <>
            <div className="mt-2 text-lg text-muted">Sold to</div>
            <div className="display text-3xl font-bold md:text-4xl" style={{ color: flash.teamColor }}>{flash.teamName}</div>
            <div className="display money mt-3 text-6xl font-bold md:text-7xl">{inr(flash.amount)}</div>
          </>
        ) : <div className="mt-2 text-lg text-muted">No successful bids</div>}
      </div>
    </div>
  );
}
