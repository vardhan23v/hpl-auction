import type { Role } from "@prisma/client";
export function roleHome(role: Role): string {
  switch (role) { case "ADMIN": return "/admin"; case "AUCTIONEER": return "/auctioneer"; case "CAPTAIN": return "/captain"; default: return "/live"; }
}
