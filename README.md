# Hostel Premier League (HPL) — Live Cricket Auction Platform

Six teams, 100-player pool, ₹1,00,000 purse per team, 11-player squads, real-time bidding over Socket.IO with a server-authoritative auction engine. Next.js 16 · TypeScript · Tailwind 4 · Prisma 6 · MySQL (Railway) · NextAuth.

## Quick start (local)

```bash
cp .env.example .env            # set DATABASE_URL (MySQL), NEXTAUTH_SECRET
npm install
npx prisma migrate dev          # creates schema
npm run db:seed                 # 6 teams, 100 players, accounts
npm run dev                     # http://localhost:3000
```

Optional: `SEED_DEMO_AUCTION=1 npm run db:seed` also simulates a partially-run auction (sold/unsold players, bids).

### Seeded logins (password `hpl2026`, override with `SEED_PASSWORD`)

| Role | Email |
|---|---|
| Admin | admin@hpl.local |
| Auctioneer | auctioneer@hpl.local |
| Captain — Team Mookambika | sathwikks0007@gmail.com |
| Captain — Dominators | sujanahosala2002@gmail.com |
| Captain — Team Trishul | hitheshpolya@gmail.com |
| Captains — Alpha / Bravo / Charlie (dummy) | captain.alp@hpl.local, captain.brv@hpl.local, captain.chr@hpl.local |

Change passwords and dummy-team captains from **Admin → Teams** / **Admin → Users**.

## Routes

| Path | Who | What |
|---|---|---|
| `/` | public | Landing page |
| `/live` | public | Spectator live room |
| `/register` | public | Player registration |
| `/squads`, `/history`, `/analytics`, `/results` | public | Squads, auction history, analytics, final results |
| `/login` | — | Role-based redirect after login |
| `/captain` | CAPTAIN | Team dashboard + live room with BID button |
| `/auctioneer` | AUCTIONEER, ADMIN | Live room + auctioneer console |
| `/admin/*` | ADMIN | Overview, live console, teams, players, registrations, queue (drag to reorder), sold, unsold, bids, users, settings |

## Architecture

- `server.ts` — custom Node server: Next.js + Socket.IO on one port (required for WebSockets on Railway).
- `src/server/auction-engine.ts` — **the** source of truth. Every mutation (start/pause/bid/sell/unsold/skip/undo) runs under a process mutex, validates state, and writes to MySQL; SELL runs in a single transaction with `SELECT … FOR UPDATE` row locks. Timer is server-driven; clients only render `timerEndsAt`.
- `src/server/socket.ts` — authenticates sockets from the NextAuth JWT cookie, rate-limits bids, broadcasts snapshots.
- `src/app/api/auction/control` — REST control surface for admin/auctioneer actions.
- `src/hooks/useAuction.ts` — client hook: snapshot state, clock-offset-corrected countdown, SOLD/UNSOLD flashes.

Socket events: `auction:started|paused|resumed|completed`, `player:started|sold|unsold|skipped|next`, `bid:placed|accepted|rejected`, `timer:updated`, `team:purseUpdated|squadUpdated`, `state:sync`.

## Deployment

Two supported layouts. Both use Railway MySQL.

### A) Vercel (web) + Railway (realtime) — recommended when you want the site on Vercel

The real-time engine (Socket.IO, timer, bid locking) needs a long-running process, which Vercel cannot host, so it runs as a small Railway service from the same repo.

**1. Railway — realtime service**
- Project → **+ New → GitHub Repo** → this repo. `railway.json` builds it and starts `npm run start:realtime`.
- Variables:
  - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}`
  - `NEXTAUTH_SECRET` = same value as on Vercel (sockets verify login tokens with it)
  - `REALTIME_SECRET` = long random string (shared with Vercel)
  - `CORS_ORIGIN` = your Vercel URL, e.g. `https://hpl-auction.vercel.app`
- Settings → Networking → **Generate Domain** → e.g. `https://hpl-realtime.up.railway.app`. Region: **Singapore** for India.

**2. Vercel — web app**
- Import the GitHub repo. `vercel.json` sets the build command and the Mumbai region.
- Environment variables:
  - `DATABASE_URL` = Railway MySQL **public** URL (`MYSQL_PUBLIC_URL`)
  - `NEXTAUTH_SECRET` = same as Railway
  - `NEXTAUTH_URL` = your Vercel URL
  - `REALTIME_URL` = the Railway domain
  - `NEXT_PUBLIC_SOCKET_URL` = the Railway domain (build-time — redeploy after changing)
  - `REALTIME_SECRET` = same as Railway
  - optional `CLOUDINARY_*` (required for photo uploads on Vercel — local disk is read-only)

### B) Railway only (single server)

Deploy this repo as one Railway service with start command `npx prisma migrate deploy && npm start`, set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SOCKET_SERVER_URL`. Leave `REALTIME_URL` unset — the app then runs Socket.IO in-process.

### Seeding

Run once against the production database from your machine: `npm run db:seed` (teams + accounts), `npx tsx prisma/import-csv.ts file.csv --replace`, `npx tsx prisma/fetch-photos.ts`.

## Scripts

`dev`, `build`, `start`, `db:migrate`, `db:deploy`, `db:seed`, `lint`.
