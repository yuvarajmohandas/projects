# FoodIndustry — Online Grocery (Belgium)

A local, runnable implementation of the "core commerce" slice of the MVP
described in [MVP.md](./MVP.md) and [DATA-MODEL.md](./DATA-MODEL.md):
product catalog, cart, checkout (delivery or pickup + slot), promo codes,
persisted orders with a status workflow, simple email/password auth, and an
admin back-office for products/stock, orders, and promo codes.

The original static HTML/CDN prototype (which didn't actually run — its
`<script src="https://unpkg.com">` tags pointed at no package) has been moved
to [legacy-prototype/](./legacy-prototype) for reference and replaced by a
real full-stack app below.

## What's implemented vs. deferred

| Area | Status |
|---|---|
| Product catalog, search, categories | ✅ Implemented |
| Cart, checkout, stock decrement | ✅ Implemented (server-authoritative pricing/stock) |
| Delivery **or** pickup + time slot | ✅ Implemented (generated slots; zone/slot admin deferred, see DATA-MODEL.md §"Should") |
| Promo codes (percentage/fixed, min order, usage limit, expiry) | ✅ Implemented |
| User accounts (register/login, saved addresses, order history) | ✅ Implemented (JWT auth) |
| Order tracking status (Placed → Preparing → Ready/Out for delivery → Completed) | ✅ Implemented |
| Admin/back-office (products, stock, orders, promo codes, homepage editor) | ✅ Implemented |
| Online payment (Stripe/Mollie) | ⏳ Deferred — checkout currently only offers "cash on receipt" / "card on receipt" |
| Loyalty points | ⏳ Deferred |
| Email/SMS notifications | ⏳ Deferred |
| Delivery zone/pickup-location administration | ⏳ Deferred (slots are generated, not zone-scoped) |

## Architecture

- **Backend** ([backend/](./backend)): Node.js + Express + TypeScript, Prisma ORM,
  SQLite (file-based, zero setup for local dev — swap the `DATABASE_URL` in
  `.env` to point Prisma at Postgres for a closer-to-production setup later).
  JWT-based auth with `CUSTOMER`/`ADMIN` roles.
- **Frontend** ([frontend/](./frontend)): React + TypeScript via Vite, React Router,
  Tailwind CSS v4. Talks to the backend over `/api`, proxied by Vite in dev.

This intentionally keeps the frontend a client-rendered SPA (not the
Next.js SSR setup suggested in DATA-MODEL.md) to minimize moving parts for
local testing; migrating to Next.js later is straightforward since the API
is fully decoupled.

## Prerequisites

- Node.js 20+ and npm

## First-time setup

```powershell
# Backend: install deps, create the SQLite DB, apply schema, seed sample data
cd backend
npm install
npm run prisma:migrate   # creates prisma/dev.db and applies the schema
npm run seed             # seeds categories, products, an admin + customer user, a promo code

# Frontend: install deps
cd ../frontend
npm install
```

Seeded accounts (see `backend/prisma/seed.ts`):
- Admin: `admin@foodindustry.local` / `Admin123!`
- Customer: `customer@foodindustry.local` / `Customer123!`
- Promo code: `WELCOME10` (10% off orders over €20)

## Running locally

Run both in separate terminals:

```powershell
# Terminal 1 — API on http://localhost:4000
cd backend
npm run dev

# Terminal 2 — web app on http://localhost:5173
cd frontend
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to
`http://localhost:4000`, so no CORS setup is needed in dev.

### Homepage visual editor

Admins can open **Admin → Homepage editor** to add, remove, and drag sections
into a different order. Supported sections include hero banners, image/text,
categories, featured products, and spacers. Header items (logo, website name,
navigation, and basket) can also be reordered and aligned left, center, or
right. Images can be dragged onto a section or selected from a file picker;
development uploads are stored in `backend/uploads/homepage` and limited to
5 MB of JPEG, PNG, GIF, or WebP files.

The homepage layout is persisted in SQLite by the
`20260920082950_add_homepage_layout` Prisma migration. For a fresh or deployed
database, run:

```powershell
cd backend
npx prisma migrate deploy
```

> **Windows/PowerShell troubleshooting**: if `npm run dev` fails with
> `File ...\npm.ps1 cannot be loaded ... not digitally signed`, PowerShell's
> execution policy is blocking npm's script wrapper. Either run `npm.cmd run
> dev` instead of `npm run dev`, or fix it once for your user with:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```
> If the frontend logs `ECONNREFUSED` on `/api/*` proxy requests, it means
> the backend (Terminal 1) isn't actually running — check that terminal for
> the `FoodIndustry API listening on http://localhost:4000` message, and
> confirm with `curl http://localhost:4000/api/health` (expect
> `{"status":"ok"}`).

## Environment variables

- `backend/.env` (copy from `backend/.env.example`): `DATABASE_URL`,
  `JWT_SECRET` (**change this for any non-local use**), `PORT`, `CORS_ORIGIN`.
- `frontend/.env` (copy from `frontend/.env.example`): `VITE_API_URL`
  (defaults to `/api`, relying on the Vite dev proxy; point it at a real API
  origin for a production build served separately from the API).

## Production build

```powershell
cd backend && npm run build && npm start     # compiled to backend/dist
cd frontend && npm run build                 # static site in frontend/dist
```

## Known gaps before this is truly "prod ready"

- Swap SQLite for PostgreSQL (already Prisma-based, so this is a one-line
  `datasource` + `DATABASE_URL` change) and run behind a real process
  manager / container.
- Add a real payment provider (Stripe/Mollie) instead of the
  cash/card-on-receipt placeholder.
- Add rate limiting, structured logging, and HTTPS/reverse-proxy in front of
  the API.
- Add automated tests (none exist yet for either app).
- Rotate `JWT_SECRET` via a secrets manager rather than `.env` in production.
