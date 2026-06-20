# ParkLedger

A multi-tenant SaaS platform that digitizes parking lot operations for small operators in Japan.

Built independently with AI-assisted development to replace paper-based workflows with a modern web application.

**Tech Stack:** Next.js · TypeScript · Supabase · Vercel · Upstash Redis

🇯🇵 日本語版 → [README_JA.md](README_JA.md)

---

## Live Demo

> [parkledger.vercel.app](https://parkledger.vercel.app)

*(Login required — screenshots below)*

---

## Project Timeline

June 2026 — Individual project (AI-assisted development)

---

## Why I Built This

An acquaintance who runs a small parking lot still relied heavily on paper ledgers and spreadsheets for managing contracts and monthly payments.

ParkLedger replaces that entire workflow. The target users are operators in their 60s with limited tech experience, so the UI is designed with large text, high contrast, and minimal complexity — optimized for mobile use in the field.

---

## Screenshots

### Dashboard — monthly payment status at a glance
![Dashboard](public/screenshots/dashboard.png)

### Payment Tracking — mark payments, download monthly reports
![Payments](public/screenshots/payments.png)

### Tenant Management — contracts and vehicle info
![Contractors](public/screenshots/contractors.png)

### Parking Slots — vacancy status across all spaces
![Garages](public/screenshots/garages.webp)

### Mobile View — optimized for on-site use
![Mobile](public/screenshots/mobile.png)

---

## What It Does

| Feature | Details |
|---|---|
| **Dashboard** | Real-time monthly payment status, vacancy rate, expiring contracts |
| **Payment Tracking** | Mark payments, export monthly reports as CSV |
| **Tenant Management** | Contract dates, vehicle info, archiving |
| **Parking Slots** | Bulk registration, vacancy / occupied status |
| **Cleaning Records** | Log cleaning history with photo uploads |
| **Inquiries** | Manage tenant inquiries with status tracking |
| **Receipts & Documents** | Print-ready parking permit and receipt PDFs |
| **Multi-tenant** | Each business sees only their own data |
| **PWA** | Installable on mobile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js / TypeScript / Tailwind CSS |
| **Backend** | Serverless API routes (Next.js) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Infrastructure** | Vercel / Upstash Redis |

---

## Security

- Row-Level Security for tenant isolation
- Rate limiting on auth endpoints
- bcrypt password hashing
- Input validation and sanitization
- CSV injection protection

---

## Development Process

This project was developed with AI-assisted coding tools.

I focused on problem definition, feature design, user experience, and iterative improvement — while leveraging AI to accelerate implementation.

Through this project, I gained hands-on experience with modern full-stack application design, deployment, and operational considerations.

---

<details>
<summary>Architecture details</summary>

```
Browser
   ↓
Next.js (Vercel)
   ↓
Supabase (PostgreSQL)
   ↓
Upstash Redis
```

- Row-Level Security for tenant data isolation
- Custom login ID system
- Rate limiting with Redis

</details>

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
│   ├── rate-limit.ts # Rate limiter
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
