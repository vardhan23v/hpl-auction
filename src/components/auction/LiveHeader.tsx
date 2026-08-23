import type { AuctionSnapshot } from "@/types/auction";
export function LiveHeader({ snap, connected, clients }: { snap: AuctionSnapshot; connected: boolean; clients: number }) {
  const live = snap.state === "LIVE" || snap.state === "PLAYER_LIVE" || snap.state === "SOLD" || snap.state === "UNSOLD";
  const active = snap.teams.filter((t) => t.squadCount < t.maxSquad).length;
  return (
    <div className="glass mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3 text-sm">
      <div className="display text-lg font-bold tracking-widest"><span className="text-gold">HPL</span> Hostel Premier League</div>
      <div className="flex items-center gap-2 font-bold"><span className={`inline-block h-2.5 w-2.5 rounded-full ${live ? "live-dot bg-live" : "bg-muted"}`} />{live ? "LIVE" : snap.state}</div>
      <div className="text-muted">Status <span className="font-semibold text-ink">{snap.state.replace("_", " ")}</span></div>
      <div className="text-muted">Remaining <span className="font-semibold text-ink">{snap.playersRemaining} / {snap.totalPlayers}</span></div>
      <div className="text-muted">Teams active <span className="font-semibold text-ink">{active}/{snap.teams.length}</span></div>
      <div className="ml-auto flex items-center gap-2 text-xs text-muted"><span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-live"}`} />{connected ? `Connected · ${clients} watching` : "Reconnecting…"}</div>
    </div>
  );
}
