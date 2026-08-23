import { prisma } from "@/lib/prisma";
import { UsersTable } from "./UsersTable";
export const dynamic = "force-dynamic";
export default async function Users() {
  const teams = await prisma.team.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return <UsersTable teams={teams} />;
}
