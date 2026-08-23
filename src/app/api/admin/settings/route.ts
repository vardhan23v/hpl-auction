import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard, parse, handle, json, audit } from "@/lib/api";
import { getSettings } from "@/server/auction-engine";
export const dynamic = "force-dynamic";

const schema = z.object({
  auctionName: z.string().min(2).max(80).optional(),
  auctionDate: z.string().datetime().nullable().optional(),
  startingPurse: z.coerce.number().int().min(1000).optional(),
  maxSquadSize: z.coerce.number().int().min(1).max(25).optional(),
  maxPlayers: z.coerce.number().int().min(6).max(500).optional(),
  bidIncrement: z.coerce.number().int().min(100).optional(),
  timerSeconds: z.coerce.number().int().min(5).max(120).optional(),
  registrationDeadline: z.string().datetime().nullable().optional(),
  registrationOpen: z.boolean().optional(),
  spectatorAccess: z.boolean().optional(),
  unsoldReentry: z.boolean().optional(),
});

export async function GET() { const g = await guard("ADMIN"); if ("error" in g) return g.error; return json(await getSettings()); }

export async function PATCH(req: Request) {
  const g = await guard("ADMIN"); if ("error" in g) return g.error;
  try {
    const data = await parse(req, schema);
    const auction = await prisma.auction.findUnique({ where: { id: 1 } });
    if (data.startingPurse !== undefined) {
      if (auction && auction.state !== "WAITING") return json({ error: "Starting purse can only change before the auction starts" }, 409);
      await prisma.team.updateMany({ data: { startingPurse: data.startingPurse, purse: data.startingPurse } });
    }
    const s = await prisma.auctionSettings.update({ where: { id: 1 }, data: { ...data, auctionDate: data.auctionDate ? new Date(data.auctionDate) : data.auctionDate, registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : data.registrationDeadline } });
    await audit(g.session.user.id, "SETTINGS_UPDATE", "AuctionSettings", "1", data);
    return json(s);
  } catch (e) { return handle(e); }
}
