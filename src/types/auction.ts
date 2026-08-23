import type { AuctionState, PlayingRole, PlayerStatus } from "@prisma/client";

export interface TeamSnapshot {
  id: string; name: string; abbreviation: string; color: string; logoUrl: string | null;
  captainName: string | null; purse: number; spent: number; squadCount: number; maxSquad: number;
}
export interface PlayerSnapshot {
  id: string; name: string; photoUrl: string | null; role: PlayingRole; battingStyle: string | null;
  bowlingStyle: string | null; age: number | null; basePrice: number; status: PlayerStatus;
  matches: number; runs: number; wickets: number; bio: string | null; hostelBlock: string | null;
}
export interface BidSnapshot { id: string; teamId: string; teamName: string; color: string; amount: number; createdAt: string }
export interface AuctionSnapshot {
  state: AuctionState;
  currentPlayer: PlayerSnapshot | null;
  currentBid: number;
  highestTeamId: string | null;
  highestTeamName: string | null;
  timerEndsAt: number | null;   // epoch ms
  timerRemainingMs: number | null;
  timerRunning: boolean;
  timerSeconds: number;
  bidIncrement: number;
  teams: TeamSnapshot[];
  bids: BidSnapshot[];
  playersRemaining: number;
  totalPlayers: number;
  soldCount: number;
  unsoldCount: number;
  serverTime: number;
  version: number;
}

export const SOCKET_EVENTS = [
  "auction:started","auction:paused","auction:resumed","auction:completed",
  "player:started","player:sold","player:unsold","player:skipped","player:next",
  "bid:placed","bid:accepted","bid:rejected","timer:updated",
  "team:purseUpdated","team:squadUpdated","auction:undo","state:sync",
] as const;
export type SocketEvent = typeof SOCKET_EVENTS[number];
