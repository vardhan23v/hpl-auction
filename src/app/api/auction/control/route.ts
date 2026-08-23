import { z } from "zod";
import * as engine from "@/server/auction-engine";
import { guard, parse, handle, json, audit } from "@/lib/api";
import { realtimeUrl, forwardControl } from "@/server/realtime-client";

const schema = z.object({
  action: z.enum(["START_AUCTION","PAUSE","RESUME","COMPLETE","RESET_AUCTION","START_PLAYER","START_TIMER","PAUSE_TIMER","RESET_TIMER","SELL","UNSOLD","SKIP","NEXT","UNDO","REQUEUE","SHUFFLE"]),
  playerId: z.string().optional(),
});

export async function POST(req: Request) {
  const g = await guard("ADMIN", "AUCTIONEER");
  if ("error" in g) return g.error;
  try {
    const { action, playerId } = await parse(req, schema);
    const adminOnly = ["RESET_AUCTION", "COMPLETE", "START_AUCTION", "REQUEUE"];
    if (adminOnly.includes(action) && g.session.user.role !== "ADMIN" && action !== "START_AUCTION" && action !== "COMPLETE") return json({ error: "Admin only" }, 403);
    if (realtimeUrl) {
      const fwd = await forwardControl(action, playerId);
      await audit(g.session.user.id, `AUCTION_${action}`, "Auction", playerId);
      return json(fwd.body, fwd.status);
    }
    let result: unknown = null;
    switch (action) {
      case "START_AUCTION": await engine.startAuction(); break;
      case "PAUSE": await engine.pauseAuction(); break;
      case "RESUME": await engine.resumeAuction(); break;
      case "COMPLETE": await engine.completeAuction(); break;
      case "RESET_AUCTION": await engine.resetAuction(); break;
      case "START_PLAYER": await engine.startPlayer(playerId); break;
      case "START_TIMER": await engine.startTimer(); break;
      case "PAUSE_TIMER": await engine.pauseTimer(); break;
      case "RESET_TIMER": await engine.resetTimer(); break;
      case "SELL": result = await engine.sellPlayer(); break;
      case "UNSOLD": await engine.markUnsold(); break;
      case "SKIP": await engine.skipPlayer(); break;
      case "NEXT": await engine.nextPlayer(); break;
      case "UNDO": await engine.undoLast(); break;
      case "SHUFFLE": result = await engine.shuffleQueue(); break;
      case "REQUEUE": if (!playerId) throw new engine.AuctionError("playerId required"); await engine.requeuePlayer(playerId); break;
    }
    await audit(g.session.user.id, `AUCTION_${action}`, "Auction", playerId);
    return json({ ok: true, result, snapshot: await engine.getSnapshot() });
  } catch (e) { return handle(e); }
}
