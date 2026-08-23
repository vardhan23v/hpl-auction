/**
 * Standalone realtime service (deploy on Railway).
 * Hosts Socket.IO + the auction engine (timer, mutex, transactions) and a small HTTP control API
 * that the Vercel-hosted Next.js app calls with a shared secret.
 */
import { createServer } from "http";
import { attachSocket } from "../src/server/socket";
import * as engine from "../src/server/auction-engine";

const port = parseInt(process.env.PORT ?? "4000", 10);
const secret = process.env.REALTIME_SECRET;
if (!secret) { console.error("REALTIME_SECRET is required"); process.exit(1); }

const json = (res: import("http").ServerResponse, status: number, body: unknown) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req: import("http").IncomingMessage) => new Promise<string>((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d)); });

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname === "/health") { try { await engine.getSettings(); return json(res, 200, { ok: true }); } catch (e) { return json(res, 503, { ok: false, error: (e as Error).message }); } }
  if (url.pathname === "/state") return json(res, 200, await engine.getSnapshot());
  if (url.pathname === "/control" && req.method === "POST") {
    if (req.headers["x-realtime-secret"] !== secret) return json(res, 401, { error: "Unauthorized" });
    try {
      const { action, playerId } = JSON.parse(await readBody(req)) as { action: string; playerId?: string };
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
        case "BROADCAST": await engine.emitSnapshot("state:sync"); break;
        default: throw new engine.AuctionError("Unknown action");
      }
      return json(res, 200, { ok: true, result, snapshot: await engine.getSnapshot() });
    } catch (e) {
      const err = e as engine.AuctionError;
      return json(res, err instanceof engine.AuctionError ? 409 : 500, { error: err.message, code: err.code });
    }
  }
  json(res, 404, { error: "Not found" });
});

attachSocket(server);
server.listen(port, () => console.log(`> HPL realtime service on :${port}`));
