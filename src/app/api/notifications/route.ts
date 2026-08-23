import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getSession();
  const list = await prisma.notification.findMany({
    where: { OR: [{ userId: null }, ...(s?.user ? [{ userId: s.user.id }] : [])] },
    orderBy: { createdAt: "desc" }, take: 30,
  });
  return json(list);
}
export async function POST() {
  const s = await getSession();
  if (s?.user) await prisma.notification.updateMany({ where: { userId: s.user.id, read: false }, data: { read: true } });
  return json({ ok: true });
}
