import Link from "next/link";
import { Nav } from "@/components/Nav";
import { TeamBadge } from "@/components/TeamBadge";
import { inr } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/server/auction-engine";
import { LivePreview } from "@/components/LivePreview";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [teams, settings, auction] = await Promise.all([prisma.team.findMany({ orderBy: { sortOrder: "asc" } }), getSettings(), prisma.auction.findUnique({ where: { id: 1 } })]);
  const totalPurse = settings.startingPurse * teams.length;
  const stats = [
    { v: String(teams.length), l: "Teams" }, { v: String(settings.maxPlayers), l: "Maximum Players" }, { v: inr(totalPurse), l: "Total Purse" },
    { v: inr(settings.startingPurse), l: "Purse Per Team" }, { v: String(settings.maxSquadSize), l: "Max Players Per Team" },
  ];
  const live = auction && !["WAITING", "COMPLETED"].includes(auction.state);
  return (
    <>
      <Nav />
      <main className="stadium relative">
        {/* Hero */}
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 text-center md:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
            <span className={`h-2 w-2 rounded-full ${live ? "live-dot bg-live" : "bg-gold"}`} />{live ? "Auction is live now" : "Season 2026 · Live Player Auction"}
          </div>
          <h1 className="display text-6xl font-bold leading-[.95] md:text-8xl lg:text-9xl">Hostel<br /><span className="bg-gradient-to-r from-gold to-gold-2 bg-clip-text text-transparent">Premier League</span></h1>
          <p className="display mt-6 text-2xl text-ink/90 md:text-4xl">&ldquo;Where Every Player Has a Price.&rdquo;</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted md:text-lg">Six teams. One auction. {inr(totalPurse)} in total purse. The battle for HPL starts here.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/live" className="btn-red !px-6 !py-3 text-base"><span className="live-dot h-2 w-2 rounded-full bg-white" /> WATCH LIVE AUCTION</Link>
            <Link href="/login" className="btn-gold !px-6 !py-3 text-base">TEAM LOGIN</Link>
            <Link href="/register" className="btn-ghost !px-6 !py-3 text-base">PLAYER REGISTRATION</Link>
          </div>
          <div className="display mt-10 text-lg tracking-widest text-muted">{teams.length} Teams • {settings.maxPlayers} Players • {inr(totalPurse)} Total Purse</div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map((s) => (
              <div key={s.l} className="card p-5 text-center"><div className="display money text-3xl font-bold md:text-4xl">{s.v}</div><div className="mt-1 text-xs uppercase tracking-wider text-muted">{s.l}</div></div>
            ))}
          </div>
        </section>

        {/* Live preview */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <SectionTitle kicker="Live Auction Preview" title="Watch the block in real time" />
          <LivePreview />
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <SectionTitle kicker="How it works" title="From registration to final squad" />
          <div className="grid gap-3 md:grid-cols-4">
            {[["01", "Register", "Players submit their profile and cricket stats."], ["02", "Approval", "Admin approves up to 100 players into the pool."], ["03", "Live auction", `Captains bid in real time with a ${settings.timerSeconds}-second timer that resets on every bid.`], ["04", "Squads", `Each team builds an ${settings.maxSquadSize}-player squad within a ${inr(settings.startingPurse)} purse.`]].map(([n, t, d]) => (
              <div key={n} className="card p-5"><div className="display text-3xl text-gold">{n}</div><div className="mt-2 font-bold">{t}</div><div className="mt-1 text-sm text-muted">{d}</div></div>
            ))}
          </div>
        </section>

        {/* Teams */}
        <section id="teams" className="mx-auto max-w-7xl px-4 py-10">
          <SectionTitle kicker="The Franchises" title="Six teams. One title." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link href={`/squads#${t.id}`} key={t.id} className="card group relative overflow-hidden p-5 transition hover:border-gold/50">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: t.color }} />
                <div className="flex items-center gap-4">
                  <TeamBadge name={t.name} abbreviation={t.abbreviation} color={t.color} logoUrl={t.logoUrl} size={56} />
                  <div className="min-w-0"><div className="display truncate text-2xl">{t.name}</div><div className="text-sm text-muted">Captain: {t.captainName ?? <span className="italic">To be announced</span>}</div></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-panel-2 p-2"><div className="text-[11px] uppercase text-muted">Purse</div><div className="money font-bold">{inr(t.purse)}</div></div>
                  <div className="rounded-lg bg-panel-2 p-2"><div className="text-[11px] uppercase text-muted">Squad</div><div className="font-bold">{t.squadCount}/{settings.maxSquadSize}</div></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <SectionTitle kicker="Auction features" title="Built for the big moment" />
          <div className="grid gap-3 md:grid-cols-3">
            {[["⚡ Real-time bidding", "Every bid is broadcast instantly to all captains and spectators via WebSockets."], ["🛡️ Server-enforced rules", "Purse, squad limit, increments and timer are validated on the server — never the browser."], ["⏱️ Shared countdown", "One server-authoritative timer; everyone sees the same clock."], ["💰 Live purse tracking", "Purses and squad counts update the instant a player is sold."], ["🎛️ Auctioneer console", "Start, pause, sell, unsold, skip and undo with confirmation."], ["📊 Analytics", "Spending, squad composition and bid activity, live."]].map(([t, d]) => (
              <div key={t} className="card p-5"><div className="font-bold">{t}</div><div className="mt-1 text-sm text-muted">{d}</div></div>
            ))}
          </div>
        </section>

        {/* Registration + CTA */}
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-2">
          <div className="card p-8"><div className="text-xs font-semibold uppercase tracking-widest text-gold">Player registration</div><h3 className="display mt-2 text-4xl">Think you&rsquo;re worth the money?</h3><p className="mt-2 text-muted">Register your profile and stats. Approved players go straight into the auction pool.</p><Link href="/register" className="btn-gold mt-5">Register as a player</Link></div>
          <div className="card bg-gradient-to-br from-live/20 to-panel p-8"><div className="text-xs font-semibold uppercase tracking-widest text-live">Live auction</div><h3 className="display mt-2 text-4xl">Don&rsquo;t miss a single bid.</h3><p className="mt-2 text-muted">The public live room shows every bid, every purse and every sale as it happens.</p><Link href="/live" className="btn-red mt-5">Enter the live room</Link></div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-10">
          <SectionTitle kicker="FAQ" title="Questions, answered" />
          <div className="flex flex-col gap-2">
            {[["Who can bid?", "Only the registered captain of each team, from their own account. Spectators watch only."], ["What is the bid increment?", `${inr(settings.bidIncrement)}. The first bid must be at least the player's base price.`], ["What happens when the timer hits zero?", "Bidding closes and the auctioneer marks the player SOLD to the highest bidder, or UNSOLD if there were no bids."], ["Can unsold players come back?", settings.unsoldReentry ? "Yes — the admin can return unsold players to the queue for a second round." : "Not in this edition."], ["Is there a squad limit?", `Yes, ${settings.maxSquadSize} players per team. A full team cannot bid.`]].map(([q, a]) => (
              <details key={q} className="card group p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>
            ))}
          </div>
        </section>

        <footer className="border-t border-line/60 py-8 text-center text-xs text-muted">Hostel Premier League · Live Auction Platform · {new Date().getFullYear()}</footer>
      </main>
    </>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return <div className="mb-6"><div className="text-xs font-semibold uppercase tracking-widest text-gold">{kicker}</div><h2 className="display text-4xl">{title}</h2></div>;
}
