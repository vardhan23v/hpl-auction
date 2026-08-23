import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  return json(await prisma.player.findMany({ where: { status: { in: ["SOLD", "UNSOLD"] } }, orderBy: { updatedAt: "desc" }, take: 40, select: { id: true, name: true, role: true, status: true, basePrice: true, soldPrice: true, soldTo: { select: { name: true, color: true } } } }));
}
