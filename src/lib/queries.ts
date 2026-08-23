import { prisma } from "./prisma";
import { getSettings } from "@/server/auction-engine";

export async function getTeamsWithSquads() {
  const [teams, settings] = await Promise.all([
    prisma.team.findMany({ orderBy: { sortOrder: "asc" }, include: { squad: { include: { player: true }, orderBy: { createdAt: "asc" } }, captain: { select: { name: true } } } }),
    getSettings(),
  ]);
  return { teams, settings };
}

export async function getStats() {
  const [players, sold, unsold, bids, settings, teams, maxBid, minBid, mostExpensive, activeTeam] = await Promise.all([
    prisma.player.count({ where: { status: { notIn: ["REGISTERED", "REJECTED"] } } }),
    prisma.player.count({ where: { status: "SOLD" } }),
    prisma.player.count({ where: { status: "UNSOLD" } }),
    prisma.bid.count(),
    getSettings(),
    prisma.team.findMany({ orderBy: { spent: "desc" } }),
    prisma.bid.aggregate({ _max: { amount: true } }),
    prisma.player.aggregate({ _min: { soldPrice: true }, _avg: { soldPrice: true }, _sum: { soldPrice: true }, where: { status: "SOLD" } }),
    prisma.player.findFirst({ where: { status: "SOLD" }, orderBy: { soldPrice: "desc" }, include: { soldTo: true } }),
    prisma.bid.groupBy({ by: ["teamId"], _count: { _all: true }, orderBy: { _count: { teamId: "desc" } }, take: 1 }),
  ]);
  const mostActive = activeTeam[0] ? teams.find((t) => t.id === activeTeam[0].teamId) : null;
  return {
    totalPlayers: players, sold, unsold, totalBids: bids, settings, teams,
    totalSpent: minBid._sum.soldPrice ?? 0, avgPrice: Math.round(minBid._avg.soldPrice ?? 0),
    highestBid: maxBid._max.amount ?? 0, lowestBid: minBid._min.soldPrice ?? 0,
    topSpender: teams[0] ?? null, mostExpensive, mostActive: mostActive ? { ...mostActive, bids: activeTeam[0]._count._all } : null,
  };
}
