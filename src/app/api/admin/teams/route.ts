import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  return json(await prisma.team.findMany({ orderBy: { sortOrder: "asc" }, include: { captain: { select: { id: true, name: true, email: true } } } }));
}
