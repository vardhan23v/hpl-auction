import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parse, handle, json, fail } from "@/lib/api";
import { getSettings } from "@/server/auction-engine";

const schema = z.object({
  name: z.string().min(2).max(80),
  photoUrl: z.string().url().optional().or(z.literal("")),
  age: z.coerce.number().int().min(14).max(60),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  hostelBlock: z.string().min(1).max(20),
  roomNumber: z.string().min(1).max(20),
  role: z.enum(["BATSMAN","BOWLER","ALL_ROUNDER","WICKETKEEPER"]),
  battingStyle: z.string().max(40).optional(),
  bowlingStyle: z.string().max(40).optional(),
  experience: z.string().max(40).optional(),
  previousExp: z.string().max(500).optional(),
  matches: z.coerce.number().int().min(0).default(0),
  runs: z.coerce.number().int().min(0).default(0),
  wickets: z.coerce.number().int().min(0).default(0),
  strikeRate: z.coerce.number().min(0).optional(),
  economy: z.coerce.number().min(0).optional(),
  achievements: z.string().max(1000).optional(),
  bio: z.string().max(1000).optional(),
});

const hits = new Map<string, number[]>();
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const arr = (hits.get(ip) ?? []).filter((t) => Date.now() - t < 60_000);
    if (arr.length >= 5) return fail("Too many registrations, try later", 429);
    hits.set(ip, [...arr, Date.now()]);

    const s = await getSettings();
    if (!s.registrationOpen) return fail("Registrations are closed", 403);
    if (s.registrationDeadline && s.registrationDeadline < new Date()) return fail("Registration deadline has passed", 403);
    const approved = await prisma.player.count({ where: { status: { notIn: ["REGISTERED", "REJECTED"] } } });
    if (approved >= s.maxPlayers) return fail("Player pool is full (100 approved players)", 403);

    const data = await parse(req, schema);
    const dup = await prisma.player.findFirst({ where: { email: data.email } });
    if (dup) return fail("A registration with this email already exists", 409);
    const player = await prisma.player.create({ data: { ...data, photoUrl: data.photoUrl || null, status: "REGISTERED", basePrice: s.bidIncrement * 2, registration: { create: {} } } });
    return json({ ok: true, id: player.id, message: "Registration submitted successfully." }, 201);
  } catch (e) { return handle(e); }
}

export async function GET() {
  const s = await getSettings();
  const approved = await prisma.player.count({ where: { status: { notIn: ["REGISTERED", "REJECTED"] } } });
  const open = s.registrationOpen && approved < s.maxPlayers && !(s.registrationDeadline && s.registrationDeadline < new Date());
  return json({ open, approved, max: s.maxPlayers, deadline: s.registrationDeadline });
}
