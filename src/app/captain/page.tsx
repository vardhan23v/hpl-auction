import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSnapshot, getSettings } from "@/server/auction-engine";
import { inr, ROLE_LABEL } from "@/lib/format";
import { CaptainRoom } from "./CaptainRoom";
import { TeamBadge } from "@/components/TeamBadge";
export const dynamic = "force-dynamic";

export default async function CaptainPage() {
  const s = await getSession();
  if (!s?.user || s.user.role !== "CAPTAIN" || !s.user.teamId) redirect("/login");
  const [team, snap, settings] = await Promise.all([
    prisma.team.findUnique({ where: { id: s.user.teamId }, include: { squad: { include: { player: true }, orderBy: { createdAt: "desc" } } } }),
    getSnapshot(), getSettings(),
  ]);
  if (!team) redirect("/login");
  return (
    <>
      <Nav />
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="card flex flex-wrap items-center gap-5 p-4" style={{ borderColor: team.color }}>
          <TeamBadge name={team.name} abbreviation={team.abbreviation} color={team.color} logoUrl={team.logoUrl} size={56} />
          <div><div className="display text-3xl">{team.name}</div><div className="text-sm text-muted">Captain: {team.captainName ?? s.user.name}</div></div>
          <div className="ml-auto grid grid-cols-4 gap-3 text-center">
            <div><div className="label">Purse</div><div className="display money text-2xl">{inr(team.purse)}</div></div>
            <div><div className="label">Spent</div><div className="display text-2xl">{inr(team.spent)}</div></div>
            <div><div className="label">Squad</div><div className="display text-2xl">{team.squadCount} / {settings.maxSquadSize}</div></div>
            <div><div className="label">Slots left</div><div className="display text-2xl">{settings.maxSquadSize - team.squadCount}</div></div>
          </div>
        </div>
      </div>
      <CaptainRoom initial={snap} teamId={team.id} />
      <div className="mx-auto max-w-7xl px-4 pb-10">
        <h3 className="display mb-3 text-2xl">My Squad</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card flex items-center justify-between border-gold/40 p-3"><div><div className="font-semibold">{team.captainName ?? s.user.name} <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">CAPTAIN</span></div><div className="text-xs text-muted">Slot 1 of {settings.maxSquadSize}</div></div></div>
            {team.squad.map((sp) => (
              <div key={sp.id} className="card flex items-center justify-between p-3"><div><div className="font-semibold">{sp.player.name}</div><div className="text-xs text-muted">{ROLE_LABEL[sp.player.role]} · {new Date(sp.createdAt).toLocaleTimeString()}</div></div><div className="money font-bold">{inr(sp.price)}</div></div>
            ))}
          </div>
      </div>
    </>
  );
}
