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

## Deploy on Railway

1. Create a Railway project → add **MySQL** plugin → add a service from this repo.
2. Variables: `DATABASE_URL` (reference the MySQL plugin's `MYSQL_URL`), `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL` (your public URL), `SOCKET_SERVER_URL` (same), optional `CLOUDINARY_*` (without them, uploads go to local disk — use Cloudinary in production).
3. `railway.json` already sets build `npm install && npx prisma generate && npm run build` and start `npx prisma migrate deploy && npm start`, with `/api/health` as the healthcheck.
4. First deploy: run `npm run db:seed` once via `railway run npm run db:seed` (or a one-off shell) to create teams and the admin account.

## Scripts

`dev`, `build`, `start`, `db:migrate`, `db:deploy`, `db:seed`, `lint`.
