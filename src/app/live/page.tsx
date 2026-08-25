import { Nav } from "@/components/Nav";
import { AuctionRoom } from "@/components/auction/AuctionRoom";
import { getSnapshotCached as getSnapshot, getSettings } from "@/server/auction-engine";
export const dynamic = "force-dynamic";
export default async function LivePage() {
  const s = await getSettings();
  if (!s.spectatorAccess) return (<><Nav /><div className="p-20 text-center text-muted">Spectator access is disabled by the admin.</div></>);
  const snap = await getSnapshot();
  return (<><Nav /><AuctionRoom initial={snap} /></>);
}
