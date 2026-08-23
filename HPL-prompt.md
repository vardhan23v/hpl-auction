# HOSTEL PREMIER LEAGUE (HPL) — LIVE CRICKET AUCTION PLATFORM

Build a complete, production-ready web application for the **Hostel Premier League (HPL)**: a private hostel cricket tournament in which **6 teams compete in a live player auction** run entirely through the website — real-time bidding, live purse and squad updates, player registration, auctioneer controls, and a public live-viewing experience.

The application must work end-to-end. Do not build a static UI with fake interactions; every important button must perform a real, server-validated operation.

---

## 1. Tournament Configuration

| Setting | Value |
|---|---|
| Name / short name | Hostel Premier League / HPL |
| Teams | **6** |
| Maximum player pool | **100** approved players |
| Starting purse | **₹1,00,000** per team (₹6,00,000 total) |
| Maximum squad size | **11** per team (max 66 players sold) |
| Default base price | **₹2,000** (configurable per player) |
| Default bid increment | **₹1,000** (configurable) |
| Default bid timer | **15 seconds** (configurable) |

Auction rules (all enforced **server-side**):

- The auction runs live on the website; captains bid in real time, spectators watch the same state.
- Every bid, sale, purse change and squad change is broadcast to all connected clients instantly.
- A team cannot bid if it has 11 players, if the bid exceeds its remaining purse, if the auction is paused, or if the player is not currently live (already sold / unsold / skipped).

---

## 2. Teams

Create exactly 6 teams. Store all team data in the database — never hard-code team details in components.

| # | Team | Captain | Email |
|---|---|---|---|
| 1 | Team Mookambika | Vinith V | sathwikks0007@gmail.com |
| 2 | Dominators | Ashwath | sujanahosala2002@gmail.com |
| 3 | Team Trishul | Vishal Shetty | hitheshpolya@gmail.com |
| 4 | Team Alpha | *(dummy — to be configured)* | — |
| 5 | Team Bravo | *(dummy — to be configured)* | — |
| 6 | Team Charlie | *(dummy — to be configured)* | — |

Admin must be able to edit every team's **name, abbreviation, logo, colour, captain name and captain email** from the admin panel. Do not invent captain details for the dummy teams.

---

## 3. Technology Stack

- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS
- **Backend:** Next.js API routes + a custom Node server hosting **Socket.IO** (required so WebSockets work on Railway)
- **Database:** **Railway MySQL** via **Prisma**
- **Auth:** NextAuth (JWT sessions) with hashed passwords and role-based access
- **Images:** Cloudinary (or any S3-compatible storage)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Database rules: never hard-code credentials; never expose `DATABASE_URL` to the client; use Prisma migrations; production must not depend on a local MySQL instance.

---

## 4. User Roles

| Role | Capabilities |
|---|---|
| **ADMIN** | Everything: manage teams, players, users, registrations, auction queue and settings; all auctioneer controls; undo; analytics; audit logs. |
| **AUCTIONEER** | Select/start player, start/pause/resume/reset timer, view bids, SELL, UNSOLD, SKIP, next player, undo last action. |
| **TEAM CAPTAIN** | Belongs to exactly one team. Log in, join the live auction, see current player/bid, place bids **for their own team only**, view team purse, squad and bid history. |
| **SPECTATOR** | Public, no login. Watch the live auction: current player, bid, highest bidder, countdown, all purses, sold/unsold lists, statistics. No bidding controls. |

Login redirects by role: Admin → Admin Dashboard, Auctioneer → Auctioneer Dashboard, Captain → Captain Dashboard, Spectator → `/live`.

---

## 5. Landing Page

Premium sports landing page with these sections, in order: Navigation, Hero, HPL Statistics, Live Auction Preview, How It Works, Teams, Auction Features, Player Registration, Live Auction CTA, FAQ, Footer.

**Hero**

- Title: **HOSTEL PREMIER LEAGUE**
- Tagline: *"Where Every Player Has a Price."*
- Subheading: *"Six teams. One auction. ₹6,00,000 in total purse. The battle for HPL starts here."*
- CTAs: **WATCH LIVE AUCTION** (primary), **TEAM LOGIN**, **PLAYER REGISTRATION**
- Strip: **6 Teams • 100 Players • ₹6,00,000 Total Purse**

**Statistics block** (visually prominent): 6 Teams · 100 Maximum Players · ₹6,00,000 Total Purse · ₹1,00,000 Purse Per Team · 11 Max Players Per Team.

**Teams section:** one card per team showing logo, name, captain, squad count, purse remaining and team colour — all read from the database.

---

## 6. Visual Design

Feel: **live cricket broadcast + modern SaaS + professional auction platform**.

- Dark, stadium-inspired background; strong typography; subtle gradients; restrained glassmorphism
- Red **LIVE** indicators; gold/amber for money; team-specific accent colours
- Smooth animations: player reveal, countdown, new bid, **SOLD**, **UNSOLD**
- Not flashy — readability during live bidding comes first

---

## 7. Player Registration

Public page with fields: Full Name, Profile Photo, Age, Phone, Email, Hostel Block, Room Number, Playing Role, Batting Style, Bowling Style, Experience, Previous Cricket Experience, Matches, Runs, Wickets, Strike Rate, Economy, Achievements, Short Bio.

On submit show **"Registration submitted successfully."** Admin can approve, reject, edit or delete registrations. Only approved players enter the auction pool. Registrations close automatically at **100 approved players** or at the configured deadline.

**Player statuses:** `REGISTERED → APPROVED → WAITING → LIVE → SOLD | UNSOLD | SKIPPED`

---

## 8. Admin Dashboard

Sidebar: Overview, Live Auction, Teams, Players, Registrations, Auction Queue, Sold Players, Unsold Players, Bids, Analytics, Users, Settings.

Overview stats: Teams, Players Registered, Approved, Sold, Unsold, Remaining, Total Money Spent, Current Player, Auction Status.

**Player management:** search, filter, add, edit, delete, approve, reject, queue, view profile.

**Auction queue:** drag-to-reorder, select next, skip, return unsold players to the queue, search, filter by role and base price. Show **Players Remaining: X / 100**.

**Settings:** auction name/date/time, starting purse, max squad size, max players, bid increment, timer duration, registration deadline, spectator access, unsold re-entry. Defaults are the values in §1.

---

## 9. Live Auction Room

The most important screen — it should look like a professional auction broadcast.

**Header:** HOSTEL PREMIER LEAGUE · 🔴 LIVE · auction status · players remaining · teams active · connection status.

**Current player card (centre):** photo, name, role, batting/bowling style, age, base price, **current bid (the most prominent element)**, highest bidder, countdown.

```
RAHUL KUMAR · All-Rounder
Base Price ₹2,000
Current Bid  ₹18,000
Highest Bidder  DOMINATORS
00:08
```

**Live bid feed:** every bid appears instantly with an animation, e.g. `Dominators — ₹18,000`.

**Team purse panel:** always shows all 6 teams with remaining purse, total spent, squad size and remaining slots; updates instantly after each sale. Show **SQUAD FULL** at 11/11 and **1 SLOT REMAINING** at 10/11.

```
Team Mookambika   ₹72,000   8/11
Dominators        ₹55,000   7/11
Team Trishul      ₹80,000   6/11
```

**Auctioneer controls** (admin/auctioneer only): START PLAYER · START TIMER · PAUSE · RESUME · RESET TIMER · SELL · UNSOLD · SKIP · NEXT PLAYER · UNDO LAST ACTION. Destructive actions require confirmation.

**Captain view:** the same room plus a large **BID ₹X** button (next valid increment). On mobile, order the layout: current player → current bid → timer → bid button → highest bidder → live bids → team purses → history.

**Spectator view** at public route `/live`: identical state, no controls.

---

## 10. Bidding, Timer and Sale Logic

**Bid flow (Socket.IO, server-authoritative):** authenticate captain → verify team → auction LIVE → player LIVE → squad < 11 → sufficient purse → bid > current bid and on the correct increment → accept → persist bid in MySQL → update current bid and highest bidder → reset timer → broadcast to all clients. Reject otherwise and emit `bid:rejected` with a reason. Never trust the client.

**Timer:** server-driven countdown (default 15 s). Every valid bid resets it. At zero, bidding stops and the auctioneer chooses **SELL** or **UNSOLD**. All clients see the same countdown.

**SOLD:** dramatic **SOLD!** overlay (player, team, price). In **one database transaction**: verify auction state, winning bid, team, purse and squad capacity → lock records → create `SquadPlayer` → deduct purse → mark player SOLD → write `AuctionEvent` → commit → broadcast. Any failure rolls back everything. Prevent double-sells and duplicate bids. Purse may never go below ₹0.

**UNSOLD:** show **UNSOLD** with player name, base price and "No successful bids"; status UNSOLD; admin may return the player to the queue.

**Auction state machine:** `WAITING → LIVE ⇄ PAUSED`, `LIVE → PLAYER_LIVE → SOLD | UNSOLD → LIVE …`, `LIVE → COMPLETED`. Only valid actions for the current state are accepted (no bids while PAUSED/SOLD; nothing after COMPLETED).

**Socket events:** `auction:started`, `auction:paused`, `auction:resumed`, `auction:completed`, `player:started`, `player:sold`, `player:unsold`, `player:skipped`, `player:next`, `bid:placed`, `bid:accepted`, `bid:rejected`, `timer:updated`, `team:purseUpdated`, `team:squadUpdated`.

---

## 11. Other Pages

- **Captain Dashboard:** team name, captain, purse, spent, squad X/11, remaining slots, purchased players (name, role, price, time), live current-bid + BID button during the auction.
- **Auction History:** player, base price, winning team, winning bid, number of bids, time, status; filter by team.
- **Squads:** per team — logo, name, captain, purse remaining, total spent, squad count, highest and average purchase; players grouped by Batsman / Bowler / All-Rounder / Wicketkeeper.
- **Analytics:** totals (players, sold, unsold, money spent), average price, highest/lowest bid, highest-spending team, most expensive player, most active team; charts for team spending, purse remaining, squad composition, roles, bid activity, player prices.
- **Final Results** (on completion): **HPL AUCTION COMPLETE** — totals, highest bid, most expensive player, top-spending team, final squads and purses. Make it visually impressive.
- **Notifications:** toasts + notification centre for registration approved, auction starting/started/paused/resumed/completed, team outbid, player sold/unsold.

---

## 12. Database Schema (Prisma / MySQL)

Models: `User`, `Team`, `Player`, `PlayerRegistration`, `Auction`, `AuctionSettings`, `AuctionSession`, `Bid`, `AuctionEvent`, `SquadPlayer`, `Notification`, `AuditLog`.

Use primary/foreign keys, unique constraints, indexes, and `createdAt`/`updatedAt` on every model. The database is the single source of truth for current bid, highest bidder, timer state, purses, squad sizes, player status and auction state.

---

## 13. Security

Password hashing, secure sessions, role-based authorisation on every route and socket handler, input validation, rate limiting, authenticated WebSocket connections, server-side bid validation, transactional purse updates, duplicate-bid and negative-purse protection, squad-limit enforcement, audit logs. Never expose secrets to the client.

---

## 14. Environment & Railway Deployment

```env
DATABASE_URL="mysql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."
SOCKET_SERVER_URL="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

`.env` must be git-ignored. Production runs on Railway with Railway MySQL, supports WebSockets, handles DB connection failures gracefully, and has no localhost dependencies.

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

---

## 15. Demo Data

Seed script: the 6 teams above (real captain data only for teams 1–3), up to 100 players across all roles with varied base prices, sample bids, sold and unsold players, and admin/auctioneer/captain accounts.

---

## 16. Code Quality

TypeScript throughout; reusable components; clean separation of API, service (Prisma) and socket layers; validation and error handling; loading and empty states; responsive components; database transactions for all money/squad mutations.

---

## 17. End-to-End Flow

```
Player registers → Admin approves → Player enters queue
→ Auctioneer starts player → 15 s timer
→ Captains bid in real time (timer resets on each bid)
→ Auctioneer SELLs / marks UNSOLD
→ Purse, squad and player status updated transactionally
→ Next player … → Auction COMPLETED → Final HPL results
```

---

## 18. Priorities

1. Reliable live bidding
2. Correct purse management
3. Correct 11-player squad limit
4. Real-time synchronisation
5. Auctioneer controls
6. Captain experience
7. Spectator experience
8. Beautiful sports UI
9. Analytics
10. Mobile responsiveness

The non-negotiable requirement: **six captains bid in the same live auction simultaneously while spectators see the exact same state in real time, with the server as the sole source of truth.** Build it end-to-end, ready to deploy on Railway MySQL.
