# DARK Promoter Management App — Handoff Context

Paste this into a new Claude session to continue where we left off.

---

## What this project is

A Next.js web app for managing nightclub promoters for a brand called **DARK**. Admins create promoters, assign them to events, and track ticket sales. Promoters sign into a personal portal (magic-link, passwordless) where they get a shareable link that auto-applies their $5 AUD Eventbrite discount code, plus can self-apply via a public `/join` form.

---

## Live URLs

- **App:** https://dark-promoters.vercel.app
- **Admin:** https://dark-promoters.vercel.app/admin
- **Promoter portal:** https://dark-promoters.vercel.app/portal (magic-link sign-in) → `/portal/dashboard`
- **Promoter sign-up:** https://dark-promoters.vercel.app/join
- **Vercel project:** mizmal account → dark-promoters project
- **GitHub:** https://github.com/mizmalos/dark-promoters (mizmalaios-3113 org)
- **Supabase:** https://ghundoajoqlcjmooehbv.supabase.co
- **Test Eventbrite event:** https://www.eventbrite.com.au/e/dark-test-tickets-1997952526791 (ID: 1997952526791)

---

## Tech stack

- **Next.js 16** App Router, TypeScript
- **Supabase** Postgres (service role key, bypasses RLS) via `@supabase/supabase-js` for app data; **Supabase Auth** (`@supabase/ssr`) for promoter magic-link sign-in, session cookies handled in `middleware.ts`
- **Eventbrite API v3** — org-wide $5 AUD discount codes created per promoter, scoped to specific events via `event_id`
- **Vercel** deployment (auto-deploys on push to `main`)
- **Tailwind CSS**

---

## Environment variables (all set in Vercel production)

```
SUPABASE_URL=https://ghundoajoqlcjmooehbv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<set in Vercel>
NEXT_PUBLIC_SUPABASE_URL=<set in Vercel>       # used by Supabase Auth (magic link / sessions)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set in Vercel>  # used by Supabase Auth (magic link / sessions)
EVENTBRITE_TOKEN=<set in Vercel — private key, never expose>   # Bearer token, used for read-only calls (attendees, orgs, ticket classes)
EVENTBRITE_SESSION=<set in Vercel — private, expires periodically>  # raw Cookie header from a logged-in eventbrite.com.au session; required for discount create/patch (see below)
NEXT_PUBLIC_BASE_URL=https://dark-promoters.vercel.app
TZ=Australia/Melbourne
```

For local dev, copy `.env.example` to `.env.local` and fill in (`.env.local` exists locally; no `.env.example` currently checked in).

---

## Key files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Supabase DB client — all database operations |
| `lib/eventbrite/api.ts` | Real Eventbrite API client — Bearer-token calls (`ebFetch`) for reads, session-cookie calls (`ebFetchSession`) for discount create/patch |
| `lib/types.ts` | Shared TypeScript types |
| `lib/utils/tickets.ts` | `countValidTickets`, `buildEventbriteUrl`, `deduplicateSales`, `suggestLinkSlug` |
| `lib/supabase-server.ts` / `lib/supabase-client.ts` | Supabase Auth clients (server/browser) for the promoter portal |
| `middleware.ts` | Refreshes/validates the Supabase Auth session, gates `/portal/dashboard/*` |
| `app/api/admin/promoters/route.ts` | GET/POST promoters (admin form — no Eventbrite call here) |
| `app/api/admin/assignments/route.ts` | POST assigns a promoter to an event (no Eventbrite call here either) |
| `app/api/admin/promoters/[id]/push-eventbrite/route.ts` | The one place that talks to Eventbrite: pushes a promoter's promo code as a discount on each active-assignment event; handles "already exists" via PATCH and surfaces `SESSION_EXPIRED` |
| `app/admin/promoters/[id]/EventbriteActions.tsx` | Client components: `PushEventbriteButton` (shows session-expired instructions inline), `CopyLinkButton` |
| `app/api/admin/sync/route.ts` | Syncs Eventbrite attendees → DB sales records |
| `app/api/join/route.ts` | Public self-serve promoter sign-up: creates the promoter row + fires a Supabase magic link (`shouldCreateUser: true`) |
| `app/join/page.tsx` | Public "Become a Promoter" form |
| `app/portal/page.tsx` | Magic-link sign-in page (redirects to dashboard if already authed) |
| `app/portal/MagicLinkForm.tsx` | Client form calling `supabase.auth.signInWithOtp` (`shouldCreateUser: false` — only existing promoters can sign in here) |
| `app/auth/callback/route.ts` | Exchanges the Supabase magic-link `code` for a session, redirects to `next` (default `/portal/dashboard`) |
| `app/portal/dashboard/page.tsx` | Promoter-facing dashboard — looks up the promoter **by auth email**, shows assigned events, ticket counts, share links, promo code |
| `app/m/[slug]/route.ts` | Redirect: `/m/{slug}` → Eventbrite URL with `?discount=PROMO_CODE` |
| `app/admin/promoters/new/page.tsx` | Admin "add promoter" form — slug generates from promo code |
| `app/admin/events/new/page.tsx` | Add event form |

---

## How the Eventbrite discount flow works today

1. Admin creates a promoter (`/admin/promoters/new`) and separately assigns them to an event (`/api/admin/assignments`) — **neither step calls Eventbrite**.
2. Admin clicks **"Push to Eventbrite"** on the promoter detail page → `POST /api/admin/promoters/[id]/push-eventbrite`.
3. That route loops over the promoter's active event assignments and calls `createEventPromoCode(orgId, promo_code, eventbrite_event_id)` for each — org-level discount endpoint, scoped with `event_id` + `ticket_class_ids`.
4. If Eventbrite says the code already exists org-wide, it PATCHes the existing discount to also cover the new event (`addEventToExistingDiscount`).
5. Discount creation/patch requires **session-cookie auth**, not the Bearer token — Eventbrite's discounts-write endpoint rejects API tokens. `EVENTBRITE_SESSION` (a raw `Cookie` header copied from a logged-in browser session on eventbrite.com.au) plus `Referer`/`Origin`/`X-CSRFToken` headers are sent on every write call.
6. **This session cookie expires periodically.** When it does, the push button surfaces a "Session expired" panel with copy-paste refresh steps (open Eventbrite DevTools, copy the `Cookie` header, paste into Vercel's `EVENTBRITE_SESSION`, wait for redeploy). This is a known fragile point — there is no long-lived credential for this endpoint currently.
7. Promoter's shareable link: `https://dark-promoters.vercel.app/m/{link_slug}` → redirects to `{eventbrite_url}?discount={PROMO_CODE}`, auto-applying the $5 discount at checkout.

**The old "currency" bug from earlier in the project (`discount.currency — Unknown parameter`) was fixed** (commits `fddd3dd`, `b672157`) — `amount_off: '5.00'` is sent with no currency field. Not an open issue.

---

## CRITICAL SECURITY CONSTRAINT

**Never touch the Eventbrite tab or interact with Eventbrite in any way without explicitly telling the user what you're about to do and getting their approval first.** This was a hard requirement set by the user. This still applies — I have not tested the live push-to-Eventbrite or session-cookie flow end-to-end; the summary above is from reading the code only.

---

## Promoter portal auth (new since last handoff)

- Promoters sign in passwordless via Supabase Auth magic link at `/portal`.
- Sign-in (`MagicLinkForm`) uses `shouldCreateUser: false` — only emails that already have a Supabase auth user can request a link there.
- Sign-up (`/join` → `/api/join`) creates the promoter DB row *and* fires a magic link with `shouldCreateUser: true`, so a brand-new applicant gets signed in immediately after applying.
- `/auth/callback` exchanges the magic-link code for a session cookie (via `@supabase/ssr`).
- `middleware.ts` only gates `/portal/dashboard/*` — validates via `getUser()` (not `getSession()`) so it's checked against Supabase's server, not just a locally-trusted cookie.
- The dashboard looks the promoter up **by the authenticated user's email** (`db.promoters.getByEmail`). If a signed-in user's email doesn't match an active promoter row, they see a "Not registered" screen instead of the dashboard.

---

## Bugs / open issues

None currently known to be broken from reading the code. Worth confirming with the user:
- Whether the `EVENTBRITE_SESSION` cookie is currently valid/fresh (it expires — see above).
- Whether the promoter-portal magic-link flow has been tested end-to-end with a real inbox since it shipped (`48cbff5`).

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

Standard local git — push from your own terminal as usual (`git push` on `main` auto-deploys via Vercel).

---

## Current state (as of 2026-08-22, from git log — not independently re-verified live)

- `main` branch, working tree clean, HEAD at `48cbff5` ("promoter portal with magic link auth + multi-event Eventbrite fix")
- Full DARK UI redesign has landed (dark theme, green accent `#B7FF00`)
- Eventbrite discount creation uses org-level discounts scoped by `event_id`, authenticated via session cookie (`EVENTBRITE_SESSION`) rather than the API token, because Eventbrite's discount-write endpoints reject Bearer tokens
- Promoter self-serve sign-up (`/join`) and magic-link portal (`/portal`, `/portal/dashboard`) are both built and wired to Supabase Auth
- Have not personally re-tested the Eventbrite push flow or the magic-link flow live in this session — see CRITICAL SECURITY CONSTRAINT above
