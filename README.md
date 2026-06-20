# ParkLedger

ParkLedger is a full-stack SaaS platform designed for small and medium-sized parking lot operators in Japan.

Built to replace paper-based workflows, it manages contracts, payments, parking slots, cleaning records, and tenant inquiries in one place.

Built and maintained independently as a real-world SaaS project.

---

## Live Demo

> [parkledger.vercel.app](https://parkledger.vercel.app)

*(Screenshots below — login required to access the app)*

---

## Screenshots

*Coming soon — dashboard, payment tracking, tenant management, and parking slot views*

---

## What It Does

Parking lot operators in Japan typically manage everything in spreadsheets or paper ledgers. ParkLedger replaces that with a purpose-built web app.

| Feature | Details |
|---|---|
| **Dashboard** | Real-time monthly payment status, vacancy rate, expiring contracts |
| **Payment Tracking** | Mark payments, bulk import via CSV, export reports |
| **Tenant Management** | Contract start/end dates, archiving, vehicle info |
| **Parking Slots** | Bulk registration, status management (vacant / occupied / maintenance) |
| **Cleaning Records** | Log cleaning history with photo uploads |
| **Inquiries** | Manage tenant inquiries with status tracking |
| **Receipts & Documents** | Print-ready parking permit and receipt PDFs |
| **Multi-tenant SaaS** | Each business sees only their own data (row-level security) |
| **PWA** | Installable on mobile, works offline-first |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Next.js API Routes (serverless), server-side rendering |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **Auth** | Supabase Auth — email/password + custom login ID system |
| **Rate Limiting** | Upstash Redis — persistent across serverless instances |
| **Deployment** | Vercel |

---

## Architecture

```
Browser
   │
   ▼
Next.js (Vercel) ── Server-side rendering + API Routes
   │
   ▼
Supabase (PostgreSQL)
   │
   ├── Row-Level Security ── Each org sees only its own data
   └── Auth ── Session management + custom login ID resolution
   │
   ▼
Upstash Redis ── Persistent rate limiting across serverless instances
```

**Multi-tenant isolation via RLS**
Every database query is automatically scoped to the logged-in user's organization. Supabase Row-Level Security policies enforce this at the database level — no manual filtering required.

**Custom login ID system**
Users log in with a short alphanumeric ID instead of their email address, improving UX for non-technical operators. The server resolves the ID internally; email addresses are never exposed to the client.

**Persistent rate limiting**
Auth endpoints are rate-limited using Upstash Redis, which maintains state across Vercel serverless function instances — something in-memory solutions cannot do.

**Server-first rendering**
All data fetching happens on the server. The client receives rendered HTML with no loading spinners on the main views.

---

## Security

- Passwords hashed via bcrypt
- Email addresses never exposed to the client
- Rate limiting on all auth endpoints (brute-force protection)
- Row-Level Security prevents cross-tenant data access
- Image upload validation (magic byte check + MIME type verification)
- Input sanitization on all API routes
- CSV injection protection on all export endpoints

---

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (auth, payments, contractors, …)
│   ├── payments/     # Payment tracking UI
│   ├── contractors/  # Tenant management UI
│   ├── garages/      # Parking slot management UI
│   ├── cleaning/     # Cleaning log UI
│   ├── inquiries/    # Inquiry management UI
│   └── print/        # Receipt & permit print views
├── lib/
│   ├── supabase/     # Server / client / admin Supabase clients
│   ├── rate-limit.ts # Upstash Redis rate limiter
│   └── validate-image.ts
└── components/       # Shared UI components
```

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/yuki-dev-app/parkledger.git
cd parkledger

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase and Upstash credentials

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Required environment variables:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## About

The problem came from a real need: a family member managing a parking lot was still using paper ledgers. ParkLedger digitizes the entire workflow — from contract registration to monthly payment tracking to receipt generation.
