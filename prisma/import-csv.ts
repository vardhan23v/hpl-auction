/* Import players from the Google Forms CSV. Usage: npx tsx prisma/import-csv.ts "file.csv" [--replace] */
import { PrismaClient, PlayingRole } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
const prisma = new PrismaClient();
const file = process.argv[2]; const replace = process.argv.includes("--replace");
const ROLE: Record<string, PlayingRole> = { ALLROUNDER: "ALL_ROUNDER", "ALL-ROUNDER": "ALL_ROUNDER", BATSMAN: "BATSMAN", BOWLER: "BOWLER", WICKETKEEPER: "WICKETKEEPER", WK: "WICKETKEEPER" };
const driveId = (u: string) => u.match(/[?&]id=([\w-]+)/)?.[1] ?? u.match(/\/d\/([\w-]+)/)?.[1] ?? null;
async function main() {
  const rows = parse(fs.readFileSync(file), { columns: (h: string[]) => h.map((c) => c.trim().toUpperCase()), skip_empty_lines: true }) as Record<string, string>[];
  if (replace) { const n = await prisma.player.deleteMany({ where: { status: { notIn: ["SOLD", "LIVE"] } } }); console.log("Removed", n.count, "existing players"); }
  let i = 0;
  for (const r of rows) {
    const name = r["NAME"]?.trim(); if (!name) continue;
    const id = driveId(r["PHOTO"] ?? "");
    const usn = r["USN"]?.trim() || null;
    await prisma.player.create({ data: {
      name, role: ROLE[(r["ROLE"] ?? "").trim().toUpperCase().replace(/\s+/g, "")] ?? "BATSMAN",
      phone: r["PHONE NUMBER"]?.trim() || null, email: r["EMAIL ID"]?.trim() || null,
      roomNumber: usn, previousExp: usn ? `USN: ${usn}` : null,
      photoUrl: id ? `drive:${id}` : null, status: "APPROVED", queueOrder: ++i, basePrice: 1000, registration: { create: {} },
    } });
  }
  console.log("Imported", i, "players");
}
main().finally(() => prisma.$disconnect());
