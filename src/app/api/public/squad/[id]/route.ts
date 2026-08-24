import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { captainName: true, squad: { orderBy: { createdAt: "asc" }, select: { id: true, price: true, player: { select: { name: true, role: true, photoUrl: true } } } } } });
  return team ? json(team) : json({ error: "Not found" }, 404);
}
