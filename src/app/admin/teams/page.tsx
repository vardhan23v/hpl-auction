import { prisma } from "@/lib/prisma";
import { TeamEditor } from "./TeamEditor";
export const dynamic = "force-dynamic";
export default async function Teams() {
  const teams = await prisma.team.findMany({ orderBy: { sortOrder: "asc" }, include: { captain: { select: { email: true, name: true } } } });
  return (<div><h1 className="display text-4xl">Teams</h1><p className="text-sm text-muted">Edit names, captains, logos and colours. Saving a captain email creates/updates the captain login.</p>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">{teams.map((t) => <TeamEditor key={t.id} team={{ id: t.id, name: t.name, abbreviation: t.abbreviation, color: t.color, logoUrl: t.logoUrl, captainName: t.captainName, captainEmail: t.captainEmail, isDummy: t.isDummy, purse: t.purse, squadCount: t.squadCount }} />)}</div></div>);
}
