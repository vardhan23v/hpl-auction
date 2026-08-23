<div align="center">

# 🏏 Hostel Premier League

**Where Every Player Has a Price.**
A production-grade live cricket auction platform — six teams, a 37-player pool, ₹1,00,000 purse per team and real-time bidding with a server-authoritative engine. Captains bid live over WebSockets while spectators watch the exact same auction state, down to the same countdown second.

[![Live Demo](https://img.shields.io/badge/Demo-Live-853BCE?style=for-the-badge&logo=railway&logoColor=white)](https://hpl-web-production.up.railway.app)
[![App Status](https://img.shields.io/website?url=https%3A%2F%2Fhpl-web-production.up.railway.app%2Fapi%2Fhealth&style=for-the-badge&label=App&up_message=online&down_message=offline&up_color=0E9F6E)](https://hpl-web-production.up.railway.app/api/health)
[![Last Commit](https://img.shields.io/github/last-commit/vardhan23v/hpl-auction/main?style=for-the-badge&color=111827&label=Last%20Commit)](https://github.com/vardhan23v/hpl-auction/commits/main)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth-JWT-7C3AED?style=for-the-badge&logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![Railway](https://img.shields.io/badge/Railway-Singapore-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.com/)

[Live demo](#-live-demo) · [Features](#-whats-inside) · [Quick start](#-quick-start) · [Architecture](#-architecture) · [Auction rules](#-auction-rules) · [Realtime protocol](#-realtime-protocol) · [Deployment](#-deployment)

</div>

---

## ✨ Live demo

| | URL |
|---|---|
| **App** | https://hpl-web-production.up.railway.app |
| **Live auction (public)** | https://hpl-web-production.up.railway.app/live |
| **Health** | [`/api/health`](https://hpl-web-production.up.railway.app/api/health) — reports DB status |

Sign in at `/login`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hpl.local` | `hpl2026` |
| Auctioneer | `auctioneer@hpl.local` | `hpl2026` |
| Captains | their registered team email | set by admin |

> Spectators need no account — the `/live` room is public.

---

## 🧭 What's inside

- **Live auction room** — broadcast-style screen: player card with photo & stats, the current bid as the hero element, highest bidder, live bid feed with animations, all six team purses updating the instant a player is sold, and dramatic **SOLD! / UNSOLD** stamps.
- **Server-authoritative bidding** — every bid is validated on the server: auction live, player live, timer open, squad < 11, purse sufficient, correct ₹1,000 increment, captain bidding only for their own team. The browser is never trusted.
- **Shared countdown** — one server-driven 15-second timer (configurable) that resets on every valid bid; every connected client sees the same clock, corrected for their clock offset.
- **Transaction-safe sales** — SELL runs in a single MySQL transaction with `SELECT … FOR UPDATE` row locks: squad entry, purse deduction, player status, auction event — commit or roll back everything. Double-sells, duplicate bids and negative purses are impossible by construction.
- **Auctioneer console** — start player (from queue or hand-picked), start/pause/reset timer, SELL / UNSOLD / SKIP / NEXT with confirmations, and **UNDO** that atomically reverses the last sale.
- **Captain dashboard** — team purse, spent, squad 11-slot tracker, purchased players, and a big BID button with quick-increment and custom-amount bidding.
- **Admin panel** — teams (name, logo, colour, captain + login sync), player CRUD with photos, registration approve/reject, drag-to-reorder auction queue, sold/unsold with re-queue, full bid log, users, auction settings, audit log.
- **Player registration** — public form with cricket stats and photo upload; pool capped at 100 approved players; auto-close on deadline.
- **Analytics & results** — team spending, purse remaining, squad composition, role distribution, bid activity, top prices; a final results page with squads and superlatives.
- **Real players** — the S-4 squad imported from the Google Forms CSV with photos pulled from Drive, resized and served by the app.

---

## 🚀 Quick start

**Prerequisites:** Node ≥ 20, MySQL 8.

```bash
git clone https://github.com/vardhan23v/hpl-auction.git
cd hpl-auction
cp .env.example .env        # set DATABASE_URL + NEXTAUTH_SECRET
npm install
npx prisma migrate dev
npm run db:seed             # 6 teams + admin/auctioneer/captain accounts
npm run dev                 # http://localhost:3000
```

Import a Google Forms player CSV and fetch Drive photos:

```bash
npx tsx prisma/import-csv.ts "players.csv" --replace
npx tsx prisma/fetch-photos.ts
```

---

## 🏗 Architecture

```
Browser ──HTTP──▶ Next.js 16 (App Router) ──┐
   │                                        ├──▶ Prisma ──▶ MySQL (Railway)
   └──WebSocket──▶ Socket.IO ──▶ Auction engine ┘
                   (same Node process — server.ts)
```

- **`server.ts`** — custom Node server running Next.js and Socket.IO on one port.
- **`src/server/auction-engine.ts`** — the single source of truth. Every mutation runs under a process-wide mutex, validates the state machine (`WAITING → LIVE ⇄ PAUSED → PLAYER_LIVE → SOLD/UNSOLD → … COMPLETED`) and persists to MySQL. Engine state lives on `globalThis` so the Next.js bundle and the custom server share one emitter, one lock, one timer.
- **`src/server/socket.ts`** — authenticates sockets from the NextAuth JWT, rate-limits bids (token bucket), broadcasts full snapshots.
- **`src/hooks/useAuction.ts`** — client hook: snapshot state, offset-corrected countdown, SOLD/UNSOLD flash events.
- **Optional split mode** — set `REALTIME_URL`/`NEXT_PUBLIC_SOCKET_URL` and the app proxies auction actions to a standalone realtime service (`realtime/server.ts`) for Vercel + Railway hosting.

## 📏 Auction rules

| Rule | Value |
|---|---|
| Teams | 6 · ₹1,00,000 purse each |
| Squad limit | 11 players (bidding auto-blocked at 11/11) |
| Base price | ₹1,000 per player |
| Bid increment | ₹1,000 (configurable) |
| Timer | 15 s, resets on every valid bid |
| Timer at zero | bidding closes — auctioneer SELLs or marks UNSOLD |
| Unsold players | admin can return them to the queue |

## 📡 Realtime protocol

`auction:started/paused/resumed/completed` · `player:started/sold/unsold/skipped/next` · `bid:placed/accepted/rejected` · `timer:updated` · `team:purseUpdated/squadUpdated` · `state:sync` — every event carries a full authoritative snapshot, so clients can never drift.

## ☁️ Deployment

Deployed on **Railway (Singapore)** — one service runs the app + WebSockets, alongside Railway MySQL over the private network.

```bash
# build:  npm install && npx prisma generate && npm run build
# start:  npx prisma migrate deploy && npm start
```

Environment: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SOCKET_SERVER_URL`, optional `CLOUDINARY_*` for durable image uploads. Keep exactly **1 replica** — the live engine is a single-process design.

---

<div align="center">

Built for the hostel, battle-tested for auction night. 🏏🔨

</div>
