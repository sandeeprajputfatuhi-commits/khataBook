# Khata Backend — Phase 1

## Local setup
1. `npm install`
2. Copy `.env.example` → `.env` and fill in `DATABASE_URL` (local Postgres or Render free Postgres)
3. Run schema: `psql $DATABASE_URL -f src/db/schema.sql`
4. `npm run dev`
5. Test: `GET http://localhost:5000/health` should return `{ status: "ok" }`

## What's built (Phase 1)
- `POST /api/customers` — add a customer
- `GET /api/customers?user_id=1` — list customers with computed balance
- `POST /api/entries` — add a ledger entry (credit/debit)
- `GET /api/entries?customer_id=1` — get a customer's transaction history

## Not built yet (later phases)
- Auth (login/signup) — Phase 2
- Customer groups + broadcast — Phase 3
- WhatsApp/SMS reminders — Phase 4
- Mandi bhav auto-fetch + notifications — Phase 5
- AI call on no-reply — Phase 6 (evaluate cost first)

## Deploy (free)
- Render.com: create a free PostgreSQL instance + a free Web Service pointed at this repo
- Set env vars in Render dashboard from `.env.example`
