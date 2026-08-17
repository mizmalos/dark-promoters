// ============================================================
// DARK — Real Eventbrite API Client
// Server-side only. Uses EVENTBRITE_TOKEN env var.
// Never import this in client components.
// ============================================================

import type { EventbriteAttendee, EventbriteSyncResult, TicketStatus } from '@/lib/types';

const BASE = 'https://www.eventbriteapi.com/v3';

function getToken(): string {
  const t = process.env.EVENTBRITE_TOKEN;
  if (!t) throw new Error('EVENTBRITE_TOKEN is not configured.');
  return t;
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
    const msg =
      (data as { error_description?: string; description?: string }).error_description ??
      (data as { error_description?: string; description?: string }).description ??
      JSON.stringify(data);
    throw new Error(`Eventbrite ${res.status}: ${msg}`);
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

/**
 * Create a brand-wide $5 AUD promo code as an organization-level discount.
 * Applies to all events in the organization automatically.
 */
export async function createPromoCode(
  orgId: string,
  code: string
): Promise<{ id: string; code: string }> {
  const data = await ebFetch(`/organizations/${orgId}/discounts/`, {
    method: 'POST',
    body: JSON.stringify({
      discount: {
        type: 'coded',
        code,
        amount_off: '5.00', // $5.00 — currency inherited from event
        quantity_available: null,
      },
    }),
  });
  return { id: String(data.id), code: String(data.code) };
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
