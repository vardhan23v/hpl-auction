import { getSnapshot } from "@/server/auction-engine";
import { AuctioneerRoom } from "@/app/auctioneer/AuctioneerRoom";
import { ResetButton } from "./ResetButton";
export const dynamic = "force-dynamic";
export default async function AdminLive() {
  return (<div><AuctioneerRoom initial={await getSnapshot()} isAdmin /><div className="px-4 pb-6"><ResetButton /></div></div>);
}
