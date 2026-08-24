/* Demo/dev seed. Real captain data only for teams 1–3; dummy teams get no captain details. */
import { PrismaClient, PlayingRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const TEAMS = [
  { name: "Team Mookambika", abbreviation: "TMK", color: "#f59e0b", captainName: "Vinith V", captainEmail: "sathwikks0007@gmail.com" },
  { name: "Dominators", abbreviation: "DOM", color: "#ef4444", captainName: "Ashwath", captainEmail: "sujanahosala2002@gmail.com" },
  { name: "Team Trishul", abbreviation: "TTR", color: "#3b82f6", captainName: "Vishal Shetty", captainEmail: "hitheshpolya@gmail.com" },
  { name: "Team Alpha", abbreviation: "ALP", color: "#10b981", isDummy: true },
  { name: "Team Bravo", abbreviation: "BRV", color: "#a855f7", isDummy: true },
  { name: "Team Charlie", abbreviation: "CHR", color: "#06b6d4", isDummy: true },
];

const FIRST = ["Rahul","Arjun","Rohan","Karthik","Suhas","Nithin","Pranav","Manoj","Akash","Deepak","Sandeep","Vikram","Harsha","Naveen","Gagan","Abhishek","Kiran","Sachin","Yash","Tejas","Anil","Ganesh","Shreyas","Varun","Mohit","Rakesh","Aditya","Nikhil","Sumanth","Chetan","Prajwal","Darshan","Lokesh","Bharath","Hemanth","Vivek","Sagar","Aravind","Dhanush","Ajay"];
const LAST = ["Kumar","Shetty","Rao","Gowda","Nair","Reddy","Hegde","Bhat","Pai","Kamath","Poojary","Shenoy","Prabhu","Acharya","Naik","Hebbar","Patil","Singh","Verma","Iyer"];
const BAT = ["Right-hand bat", "Left-hand bat"];
const BOWL = ["Right-arm fast", "Right-arm medium", "Left-arm medium", "Off spin", "Leg spin", "Left-arm orthodox"];
const ROLES: PlayingRole[] = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];

let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

async function main() {
  const demo = process.env.SEED_DEMO_AUCTION === "1";
  const pw = process.env.SEED_PASSWORD ?? "hpl2026";
  const hash = await bcrypt.hash(pw, 10);

  await prisma.auctionSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.auction.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const teams = [];
  for (const [i, t] of TEAMS.entries()) {
    teams.push(await prisma.team.upsert({ where: { name: t.name }, update: { sortOrder: i }, create: { ...t, isDummy: t.isDummy ?? false, sortOrder: i, squadCount: 1 } }));
  }

  await prisma.user.upsert({ where: { email: "admin@hpl.local" }, update: {}, create: { name: "HPL Admin", email: "admin@hpl.local", role: "ADMIN", passwordHash: hash } });
  await prisma.user.upsert({ where: { email: "auctioneer@hpl.local" }, update: {}, create: { name: "HPL Auctioneer", email: "auctioneer@hpl.local", role: "AUCTIONEER", passwordHash: hash } });
  for (const t of teams) {
    const email = t.captainEmail ?? `captain.${t.abbreviation.toLowerCase()}@hpl.local`;
    await prisma.user.upsert({ where: { email }, update: { teamId: t.id, role: "CAPTAIN" }, create: { name: t.captainName ?? `${t.name} Captain`, email, role: "CAPTAIN", teamId: t.id, passwordHash: hash } });
  }

  const count = await prisma.player.count();
  if (count === 0) {
    const names = new Set<string>();
    while (names.size < 100) names.add(`${pick(FIRST)} ${pick(LAST)}`);
    let i = 0;
    for (const name of names) {
      const role = ROLES[i % 4 === 3 ? (rnd() < 0.3 ? 3 : ri(0, 2)) : ri(0, 2)];
      const bowler = role !== "BATSMAN" && role !== "WICKETKEEPER";
      const matches = ri(5, 80);
      await prisma.player.create({ data: {
        name, age: ri(18, 26), phone: `98${ri(10000000, 99999999)}`, email: `${name.toLowerCase().replace(/ /g, ".")}${i}@hostel.local`,
        hostelBlock: pick(["A", "B", "C", "D"]), roomNumber: String(ri(101, 420)), role, battingStyle: pick(BAT), bowlingStyle: bowler ? pick(BOWL) : null,
        experience: pick(["Beginner", "Intermediate", "Advanced"]), previousExp: pick(["Hostel league", "College team", "District U-19", "Gully cricket legend", null]),
        matches, runs: role === "BOWLER" ? ri(20, 400) : ri(matches * 8, matches * 35), wickets: bowler ? ri(matches, matches * 2) : ri(0, 5),
        strikeRate: Math.round((90 + rnd() * 70) * 10) / 10, economy: bowler ? Math.round((5 + rnd() * 5) * 10) / 10 : null,
        bio: pick(["Big hitter, bigger heart.", "Death-over specialist.", "Plays every ball on merit.", "Safe hands, sharp mind.", "Power-play destroyer."]),
        basePrice: pick([1000, 2000, 2000, 2000, 3000, 5000]), status: i < 88 ? "APPROVED" : "REGISTERED", queueOrder: i + 1,
        registration: { create: {} },
      } });
      i++;
    }
    console.log("Seeded 100 players (88 approved, 12 pending registration)");
  }

  if (demo) {
    // Simulate a partial auction: a few sold and unsold players.
    const pool = await prisma.player.findMany({ where: { status: "APPROVED" }, orderBy: { queueOrder: "asc" }, take: 14 });
    const captains = await prisma.user.findMany({ where: { role: "CAPTAIN" } });
    await prisma.player.updateMany({ where: { status: "APPROVED" }, data: { status: "WAITING" } });
    await prisma.auction.update({ where: { id: 1 }, data: { state: "LIVE", startedAt: new Date() } });
    for (const [k, p] of pool.entries()) {
      if (k % 5 === 4) { await prisma.player.update({ where: { id: p.id }, data: { status: "UNSOLD" } }); await prisma.auctionEvent.create({ data: { type: "PLAYER_UNSOLD", playerId: p.id } }); continue; }
      const bidders = [...teams].sort(() => rnd() - 0.5).slice(0, ri(2, 4));
      let amount = p.basePrice; let winner = bidders[0];
      for (let b = 0; b < ri(3, 8); b++) {
        const t = bidders[b % bidders.length]; winner = t; const u = captains.find((c) => c.teamId === t.id);
        await prisma.bid.create({ data: { playerId: p.id, teamId: t.id, userId: u?.id, amount } }); amount += 1000;
      }
      const price = amount - 1000;
      await prisma.$transaction([
        prisma.squadPlayer.create({ data: { teamId: winner.id, playerId: p.id, price } }),
        prisma.team.update({ where: { id: winner.id }, data: { purse: { decrement: price }, spent: { increment: price }, squadCount: { increment: 1 } } }),
        prisma.player.update({ where: { id: p.id }, data: { status: "SOLD", soldPrice: price, soldToId: winner.id, soldAt: new Date() } }),
        prisma.auctionEvent.create({ data: { type: "PLAYER_SOLD", playerId: p.id, teamId: winner.id, amount: price } }),
      ]);
    }
    console.log("Seeded demo auction activity");
  }
  console.log(`\nLogins (password: ${pw})\n  admin@hpl.local (ADMIN)\n  auctioneer@hpl.local (AUCTIONEER)\n  sathwikks0007@gmail.com → Team Mookambika\n  sujanahosala2002@gmail.com → Dominators\n  hitheshpolya@gmail.com → Team Trishul\n  captain.alp/brv/chr@hpl.local → dummy teams`);
}
main().finally(() => prisma.$disconnect());
