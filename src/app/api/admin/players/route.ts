import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard, parse, handle, json, audit } from "@/lib/api";
export const dynamic = "force-dynamic";

export const playerSchema = z.object({
  name: z.string().min(2).max(80),
  photoUrl: z.string().nullable().optional(),
  age: z.coerce.number().int().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  hostelBlock: z.string().nullable().optional(),
  roomNumber: z.string().nullable().optional(),
  role: z.enum(["BATSMAN","BOWLER","ALL_ROUNDER","WICKETKEEPER"]),
  battingStyle: z.string().nullable().optional(),
  bowlingStyle: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  previousExp: z.string().nullable().optional(),
  matches: z.coerce.number().int().min(0).default(0),
  runs: z.coerce.number().int().min(0).default(0),
  wickets: z.coerce.number().int().min(0).default(0),
  strikeRate: z.coerce.number().nullable().optional(),
  economy: z.coerce.number().nullable().optional(),
  achievements: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  basePrice: z.coerce.number().int().min(500).default(2000),
  status: z.enum(["REGISTERED","REJECTED","APPROVED","WAITING","LIVE","SOLD","UNSOLD","SKIPPED"]).optional(),
});

export async function GET(req: Request) {
  const g = await guard("ADMIN", "AUCTIONEER"); if ("error" in g) return g.error;
  const u = new URL(req.url);
  const q = u.searchParams.get("q") ?? undefined;
  const status = u.searchParams.get("status") ?? undefined;
  const role = u.searchParams.get("role") ?? undefined;
  const players = await prisma.player.findMany({
    where: { ...(q ? { name: { contains: q } } : {}), ...(status ? { status: status as never } : {}), ...(role ? { role: role as never } : {}) },
    orderBy: [{ queueOrder: "asc" }, { createdAt: "desc" }], include: { soldTo: { select: { name: true, color: true } } }, take: 500,
  });
  return json(players);
}

export async function POST(req: Request) {
  const g = await guard("ADMIN"); if ("error" in g) return g.error;
  try {
    const data = await parse(req, playerSchema);
    const p = await prisma.player.create({ data: { ...data, email: data.email || null, status: data.status ?? "APPROVED" } });
    await audit(g.session.user.id, "PLAYER_CREATE", "Player", p.id);
    return json(p, 201);
  } catch (e) { return handle(e); }
}
