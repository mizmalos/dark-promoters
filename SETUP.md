# DARK Promoter Management — Setup Guide

## Requirements

- Node.js 18+
- npm

That's it for the MVP. No database or external accounts needed.

---

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## What you'll see

| URL | What it is |
|-----|------------|
| `http://localhost:3000` | Home — links to admin and portal |
| `http://localhost:3000/admin` | Admin dashboard |
| `http://localhost:3000/admin/promoters` | Promoters list (Claire, Jake, Maya) |
| `http://localhost:3000/admin/events` | Events list (Melbourne + Sydney) |
| `http://localhost:3000/admin/sync` | Sync logs + mock sync trigger |
| `http://localhost:3000/portal?promoter=claire` | Claire's promoter portal |
| `http://localhost:3000/portal?promoter=jake` | Jake's promoter portal |
| `http://localhost:3000/portal?promoter=maya` | Maya's promoter portal |
| `http://localhost:3000/m/claire-240kmh` | Redirects → Eventbrite + CLAIRE code |
| `http://localhost:3000/m/jake-240kmh` | Redirects → Eventbrite + JAKE code |
| `http://localhost:3000/m/maya-240kmh` | Redirects → Eventbrite + MAYA code |
| `http://localhost:3000/m/claire-f2f-syd` | Redirects → Sydney event + CLAIRE code |

---

## Run tests

```bash
npm test
```

Expected output: **39 tests passing**

Tests cover: ticket quantity counting, invalid status exclusion, duplicate prevention, milestone calculation, URL construction, redirect safety, and slug generation.

---

## Mock data summary

**Promoters**
| Name | Code | Slug | City |
|------|------|------|------|
| Claire Martin | CLAIRE | claire | Melbourne, VIC |
| Jake Torres | JAKE | jake | Sydney, NSW |
| Maya Singh | MAYA | maya | Brisbane, QLD |

**Events**
| Event | City | Eventbrite ID |
|-------|------|---------------|
| 240KMH F2F Melbourne — September 2026 | Melbourne, VIC | 1988138282121 |
| 240KMH F2F Sydney — October 2026 | Sydney, NSW | 9999999999999 |

**Valid ticket counts** (after excluding refunded/cancelled/comp/test)
| Promoter | Event | Valid Tickets |
|----------|-------|---------------|
| Claire | Melbourne | 14 |
| Claire | Sydney | 7 |
| Jake | Melbourne | 5 |
| Maya | Melbourne | 22 |
| Maya | Sydney | 3 |

---

## File structure

```
dark-promoters/
├── app/
│   ├── admin/          # Admin dashboard, promoters, events, sync
│   ├── portal/         # Promoter portal (MVP: ?promoter=slug)
│   ├── m/[slug]/       # Public redirect handler
│   └── api/admin/      # API routes (promoters, events, assignments, sync)
├── lib/
│   ├── types.ts        # All TypeScript types
│   ├── mock-db.ts      # In-memory data store (replaces Supabase in MVP)
│   ├── utils/tickets.ts # Business logic (counting, URLs, safety)
│   └── eventbrite/mock.ts # Mock Eventbrite API (swap for real in Phase 3)
├── supabase/
│   ├── migrations/001_initial.sql  # Full schema with RLS
│   └── seed.sql                    # Seed data matching mock-db.ts
├── __tests__/tickets.test.ts
├── .env.example
└── vitest.config.ts
```

---

## Phase 3 checklist (connecting real services)

When ready to connect Supabase and Eventbrite:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Run `supabase/seed.sql` to load the initial data
4. Copy `.env.example` → `.env.local` and fill in your Supabase keys
5. Replace `lib/mock-db.ts` calls with Supabase client calls
6. Replace `lib/eventbrite/mock.ts` with the real Eventbrite API client
7. Add your Eventbrite API key to `.env.local` (server-side only)
8. Deploy to Vercel and configure `tickets.dark.com` as a custom domain
