# DARK Promoter Management App — Handoff Context

Paste this into a new Claude session to continue where we left off.

---

## What this project is

A Next.js web app for managing nightclub promoters for a brand called **DARK**. It lets admins create promoters, assign them to events, and track ticket sales. Promoters get a personal portal page and a shareable link that auto-applies their $5 AUD Eventbrite discount code.

---

## Live URLs

- **App:** https://dark-promoters.vercel.app
- **Admin:** https://dark-promoters.vercel.app/admin
- **Vercel project:** mizmal account → dark-promoters project
- **GitHub:** https://github.com/mizmalos/dark-promoters (mizmalaios-3113 org)
- **Supabase:** https://ghundoajoqlcjmooehbv.supabase.co
- **Test Eventbrite event:** https://www.eventbrite.com.au/e/dark-test-tickets-1997952526791 (ID: 1997952526791)

---

## Tech stack

- **Next.js 16** App Router, TypeScript
- **Supabase** Postgres (service role key, bypasses RLS) via `@supabase/supabase-js`
- **Eventbrite API v3** — organization-wide $5 AUD discount codes auto-created on promoter creation
- **Vercel** deployment (auto-deploys on push to `main`)
- **Tailwind CSS**

---

## Environment variables (all set in Vercel production)

```
SUPABASE_URL=https://ghundoajoqlcjmooehbv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<set in Vercel>
EVENTBRITE_TOKEN=<set in Vercel — private key, never expose>
NEXT_PUBLIC_BASE_URL=https://dark-promoters.vercel.app
TZ=Australia/Melbourne
```

For local dev, copy `.env.example` to `.env.local` and fill in.

---

## Key files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Supabase DB client — all database operations |
| `lib/eventbrite/api.ts` | Real Eventbrite API client |
| `lib/types.ts` | Shared TypeScript types |
| `lib/utils/tickets.ts` | `countValidTickets`, `buildEventbriteUrl`, `deduplicateSales` |
| `app/api/admin/promoters/route.ts` | POST creates promoter + auto-creates Eventbrite discount |
| `app/api/admin/promoters/[id]/push-eventbrite/route.ts` | Manually push existing promoter's promo code to Eventbrite |
| `app/api/admin/sync/route.ts` | Syncs Eventbrite attendees → DB sales records |
| `app/admin/promoters/new/page.tsx` | Add promoter form — slug auto-generates from name, promo code is manual |
| `app/admin/promoters/[id]/page.tsx` | Promoter detail — shareable links, Push to Eventbrite button |
| `app/admin/promoters/[id]/EventbriteActions.tsx` | Client components: PushEventbriteButton, CopyLinkButton |
| `app/portal/page.tsx` | Promoter-facing portal (async, awaits searchParams) |
| `app/m/[slug]/route.ts` | Redirect: /m/{slug} → Eventbrite URL with ?discount=PROMO_CODE |
| `app/admin/events/new/page.tsx` | Add event form |

---

## How the Eventbrite discount flow works

1. Admin creates promoter → API auto-calls `POST /v3/organizations/{id}/discounts/` with a $5 AUD org-wide code
2. If Eventbrite fails, promoter still saves — response includes `eventbrite_warning`
3. Shareable link: `https://dark-promoters.vercel.app/m/{link_slug}`
4. That redirects to: `{eventbrite_url}?discount={PROMO_CODE}`
5. Discount auto-applies at Eventbrite checkout

---

## CRITICAL SECURITY CONSTRAINT

**Never touch the Eventbrite tab or interact with Eventbrite in any way without explicitly telling the user what you're about to do and getting their approval first.** This was a hard requirement set by the user.

---

## Bugs to fix (priority order)

### 1. Eventbrite discount creation failing — URGENT
When creating a promoter, Eventbrite returns:
```
400: There are errors with your arguments: discount.currency - Unknown parameter
```
In `lib/eventbrite/api.ts`, the `createPromoCode` function is passing `currency` as a field in the discount payload. Eventbrite's discount endpoint does not accept `currency` — remove it. The discount amount should just use `amount_off: '5.00'` without a currency field. Fix: remove `currency: 'AUD'` from the POST body in `createPromoCode`.

### 2. Slug auto-generation — behaviour to confirm
Currently typing a name auto-fills the slug (e.g. "Omey Boyaci" → "omey-boyaci"). Promo code is left blank for manual entry. User mentioned the slug copying feels off — confirm desired behaviour with user.

---

## Pending features (deferred, not yet built)

### SMS on promoter assignment
When a promoter is assigned to an event, send them their shareable link via SMS. Using Twilio (~9¢ AUD/SMS). User said: "lets revisit this once we do some tests - just remember to prompt me on this." **Remind the user about this when testing is complete.**

### Instagram group chat + broadcast channel
User wants the promoter add form to prompt new promoters to join DARK's Instagram group chat and broadcast channel. Implementation pending — need the broadcast channel invite link and Instagram handle from user before building.

### Import full promoter spreadsheet
User has a spreadsheet of existing promoters to bulk-import into Supabase. Not yet done.

---

## Git workflow

The sandbox cannot push to GitHub directly (auth issue). The user pushes from their own Terminal. Standard flow:
```bash
cd ~/Library/Application\ Support/Claude/local-agent-mode-sessions/.../outputs/dark-promoters
git push
```

The `billylelba` GitHub account is a collaborator on the repo and handles pushes from Claude Code in the terminal.

---

## Current state

- Database is clean (no test data)
- One real event in DB: "DARK TEST" linked to Eventbrite event 1997952526791
- One test promoter created: "omey boyaci" (slug: omey-boyaci, promo: OMEY) — Eventbrite discount creation FAILED due to the currency bug above
- All 4 Vercel env vars are set and the app is live
- The Eventbrite integration is wired up but broken due to the currency parameter bug
