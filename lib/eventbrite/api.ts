// ============================================================
// DARK — Real Eventbrite API Client
// Server-side only. Uses EVENTBRITE_TOKEN env var.
// Never import this in client components.
// ============================================================

import type { EventbriteAttendee, EventbriteSyncResult, TicketStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const BASE     = 'https://www.eventbriteapi.com/v3';
const BASE_AU  = 'https://www.eventbrite.com.au/api/v3';

function getToken(): string {
  const t = process.env.EVENTBRITE_TOKEN;
  if (!t) throw new Error('EVENTBRITE_TOKEN is not configured.');
  return t;
}

/** Carries the HTTP status + raw Eventbrite response body, so callers can branch on structured
 * data instead of matching against Eventbrite's English error prose. */
export class EventbriteApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'EventbriteApiError';
    this.status = status;
    this.body = body;
  }
}

async function ebFetch(path: string, options: RequestInit = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Eventbrite] Error response:', JSON.stringify(data));
    const msg =
      (data as { error_description?: string; description?: string }).error_description ??
      (data as { error_description?: string; description?: string }).description ??
      JSON.stringify(data);
    throw new EventbriteApiError(res.status, data, `Eventbrite ${res.status}: ${msg}`);
  }
  return data as Record<string, unknown>;
}

/** Public wrapper for debugging — returns raw response without throwing on error. */
export async function ebFetchDebug(path: string): Promise<Record<string, unknown>> {
  return ebFetch(path);
}

/**
 * Reads the live Eventbrite session cookie — the `eventbrite_session` table is the source
 * of truth (kept fresh via scripts/refresh-eventbrite-session.mjs), falling back to the
 * EVENTBRITE_SESSION env var if the table is empty.
 */
async function getSessionCookie(): Promise<string | null> {
  const { data } = await supabase
    .from('eventbrite_session')
    .select('cookie')
    .eq('id', 1)
    .maybeSingle();
  return data?.cookie ?? process.env.EVENTBRITE_SESSION ?? null;
}

/**
 * Fetch using the .com.au session cookie (for endpoints that reject Bearer tokens).
 */
async function ebFetchSession(path: string, options: RequestInit = {}): Promise<Record<string, unknown>> {
  const sessionCookie = await getSessionCookie();
  if (!sessionCookie) throw new Error('No Eventbrite session cookie configured. Run scripts/refresh-eventbrite-session.mjs with a fresh Cookie header from DevTools.');

  // Extract CSRF token from the cookie string for the X-CSRFToken header
  const csrfToken = sessionCookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';

  const res = await fetch(`${BASE_AU}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
      Referer: 'https://www.eventbrite.com.au/',
      Origin: 'https://www.eventbrite.com.au',
      'X-CSRFToken': csrfToken,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Eventbrite Session] Error response:', JSON.stringify(data));
    const msg =
      (data as { error_description?: string; description?: string }).error_description ??
      (data as { error_description?: string; description?: string }).description ??
      JSON.stringify(data);
    throw new EventbriteApiError(res.status, data, `Eventbrite ${res.status}: ${msg}`);
  }
  return data as Record<string, unknown>;
}

// ---- Organization ----

/** Returns the first organization ID associated with this token. */
export async function getOrganizationId(): Promise<string> {
  const data = await ebFetch('/users/me/organizations/');
  const orgs = data.organizations as Array<{ id: string | number }> | undefined;
  const org = orgs?.[0];
  if (!org) throw new Error('No Eventbrite organizations found for this token.');
  return String(org.id);
}

// ---- Discounts ----

/** Fetch all ticket class IDs for an event. */
async function getTicketClassIds(eventId: string): Promise<string[]> {
  const data = await ebFetch(`/events/${eventId}/ticket_classes/`);
  const classes = data.ticket_classes as Array<{ id: string | number }> | undefined;
  return (classes ?? []).map(tc => String(tc.id));
}

/**
 * True if an Eventbrite error represents a discount code that already exists — as opposed to
 * an auth failure, validation error, or anything else. Matches on the structured response body
 * (not pre-flattened error text) so it isn't tied to one specific phrasing.
 */
function isDuplicateDiscountError(err: unknown): boolean {
  if (!(err instanceof EventbriteApiError)) return false;
  if (err.status !== 400 && err.status !== 409) return false;
  const text = JSON.stringify(err.body).toLowerCase();
  return ['already', 'duplicate', 'exists', 'in use', 'unique'].some(kw => text.includes(kw));
}

/**
 * Check whether `eventId` itself already has a discount with this code — the org-level
 * discounts list does NOT include discounts created directly on an event (e.g. via its
 * Promotions tab, or carried over when the event was duplicated from another one), so this
 * has to be checked separately rather than inferred from the org-wide search below.
 */
async function findEventDiscountByCode(eventId: string, code: string): Promise<string | null> {
  try {
    const data = await ebFetchSession(`/events/${eventId}/discounts/?page_size=100`);
    const discounts = data.discounts as Array<{ id: string | number; code?: string }> | undefined;
    const match = discounts?.find(d => (d.code ?? '').toLowerCase() === code.toLowerCase());
    return match ? String(match.id) : null;
  } catch {
    return null;
  }
}

/**
 * Search org-level discounts for an existing code. Used as a fallback when the code doesn't
 * already exist directly on the target event, to find the discount to PATCH onto it.
 */
async function findOrgDiscount(orgId: string, code: string): Promise<string | null> {
  try {
    const data = await ebFetchSession(`/organizations/${orgId}/discounts/?query=${encodeURIComponent(code)}&page_size=50`);
    const discounts = data.discounts as Array<{ id: string | number; code: string }> | undefined;
    const match = discounts?.find(d => (d.code ?? '').toLowerCase() === code.toLowerCase());
    return match ? String(match.id) : null;
  } catch {
    return null;
  }
}

/** PATCH an existing org discount to also apply to a new event. */
async function addEventToExistingDiscount(orgId: string, discountId: string, eventId: string): Promise<void> {
  const ticketClassIds = await getTicketClassIds(eventId);
  console.log('[Eventbrite] Patching discount', discountId, 'for event', eventId);

  await ebFetchSession(`/organizations/${orgId}/discounts/${discountId}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      discount: {
        event_id: eventId,
        ticket_class_ids: ticketClassIds.length > 0 ? ticketClassIds : null,
      },
    }),
  });
}

/**
 * Create a $5 org-level promo code via the organization discounts endpoint.
 * Includes event_id and ticket_class_ids to satisfy Eventbrite's validation.
 */
async function createEventPromoCode(orgId: string, code: string, eventId: string): Promise<{ id: string; code: string }> {
  const ticketClassIds = await getTicketClassIds(eventId);

  const body: Record<string, unknown> = {
    type: 'coded',
    discount_type: 'coded',
    code,
    amount_off: '5.00',
    event_id: eventId,          // singular string, not array
    ticket_class_ids: ticketClassIds.length > 0 ? ticketClassIds : null,
    hold_ids: null,
    quantity_available: 0,
    start_date: null,
    end_date: null,
  };

  const data = await ebFetchSession(`/organizations/${orgId}/discounts/`, {
    method: 'POST',
    body: JSON.stringify({ discount: body }),
  });
  return { id: String(data.id), code: String(data.code) };
}

export type EnsurePromoCodeStatus = 'created' | 'already_active' | 'patched';

/**
 * Make sure `code` exists as a discount on `eventId`, handling the case where it already
 * does (e.g. the event was duplicated from one that already had this promoter's code)
 * as an expected, non-error outcome rather than surfacing Eventbrite's "already exists" error.
 */
export async function ensureEventPromoCode(
  orgId: string,
  code: string,
  eventId: string,
): Promise<EnsurePromoCodeStatus> {
  try {
    await createEventPromoCode(orgId, code, eventId);
    return 'created';
  } catch (err) {
    if (!isDuplicateDiscountError(err)) throw err;

    // Check the target event directly first — this catches discounts created straight on
    // the event (Promotions tab, or carried over by Eventbrite's own "duplicate event").
    if (await findEventDiscountByCode(eventId, code)) return 'already_active';

    // Not on this event — the code exists elsewhere in the org. Find it and attach this event too.
    const discountId = await findOrgDiscount(orgId, code);
    if (!discountId) throw new Error(`Could not find discount with code "${code}" to patch.`);
    await addEventToExistingDiscount(orgId, discountId, eventId);
    return 'patched';
  }
}

// ---- Attendees ----

/**
 * Fetch all attendees for an Eventbrite event, handling pagination.
 * Each attendee record = 1 ticket (Eventbrite model).
 * Expands promotional_code so we can filter by promo code used.
 */
export async function fetchEventAttendees(
  eventbriteEventId: string
): Promise<EventbriteSyncResult> {
  const attendees: EventbriteAttendee[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await ebFetch(
      `/events/${eventbriteEventId}/attendees/?expand=promotional_code&page=${page}`
    );

    const rows = data.attendees as Array<{
      id: string | number;
      order_id: string | number;
      status: string;
      created: string;
      promotional_code?: { code?: string };
    }> | undefined;

    for (const a of rows ?? []) {
      attendees.push({
        id: String(a.id),
        order_id: String(a.order_id),
        quantity: 1, // Eventbrite: one attendee record = one ticket
        status: mapStatus(a.status),
        created: a.created,
        promo_code: a.promotional_code?.code ?? '',
      });
    }

    const pagination = data.pagination as { has_more_items?: boolean } | undefined;
    hasMore = pagination?.has_more_items ?? false;
    page++;
  }

  return { eventId: eventbriteEventId, attendees, fetchedAt: new Date().toISOString() };
}

// ---- Helpers ----

function mapStatus(ebStatus: string): TicketStatus {
  switch ((ebStatus ?? '').toLowerCase()) {
    case 'attending':
    case 'checked_in':
    case 'checked in':
      return 'valid';
    case 'refunded':
      return 'refunded';
    case 'not_attending':
    case 'not attending':
    case 'cancelled':
    default:
      return 'cancelled';
  }
}
