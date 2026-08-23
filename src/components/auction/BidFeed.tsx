import { inr } from "@/lib/format";
import type { BidSnapshot } from "@/types/auction";
export function BidFeed({ bids, compact = false }: { bids: BidSnapshot[]; compact?: boolean }) {
  return (
    <div className="card flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between"><h3 className="display text-lg">Live Bids</h3><span className="text-xs text-muted">{bids.length} bids</span></div>
      <div className={`flex flex-col gap-1.5 overflow-auto ${compact ? "max-h-56" : "max-h-[420px]"}`}>
        {bids.length === 0 && <div className="py-6 text-center text-sm text-muted">Waiting for the first bid…</div>}
        {bids.map((b, i) => (
          <div key={b.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${i === 0 ? "bid-new bg-gold/10 ring-1 ring-gold/40" : "bg-panel-2"}`}>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} /><span className="text-sm font-semibold">{b.teamName}</span></div>
            <div className="money font-bold tabular-nums">{inr(b.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
