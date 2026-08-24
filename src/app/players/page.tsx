import { Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/format";
import { PlayersBrowser, type PubPlayer } from "./PlayersBrowser";
export const dynamic = "force-dynamic";
export const metadata = { title: "Player Pool" };

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    where: { status: { notIn: ["REGISTERED", "REJECTED"] } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: { id: true, name: true, photoUrl: true, role: true, battingStyle: true, bowlingStyle: true, age: true, hostelBlock: true, matches: true, runs: true, wickets: true, basePrice: true, status: true, soldPrice: true, soldTo: { select: { name: true, color: true } } },
  });
  const pool = players.length, sold = players.filter((p) => p.status === "SOLD").length;
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">The pool</div>
            <h1 className="display text-5xl">Auction Players</h1>
          </div>
          <div className="text-sm text-muted">{pool} players · {sold} sold · base price {inr(1000)}</div>
        </div>
        <PlayersBrowser players={players as PubPlayer[]} />
      </main>
    </>
  );
}
