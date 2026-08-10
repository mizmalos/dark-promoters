// ============================================================
// DARK — Mock Eventbrite Integration
//
// This file implements the same interface that the real Eventbrite
// API client will use. Swap this file for the real implementation
// in Phase 3 without changing any consuming code.
// ============================================================

import type { EventbriteSyncResult, EventbriteAttendee, TicketStatus } from '@/lib/types';

/**
 * Fetch attendees for an event from Eventbrite.
 * In production this will call the Eventbrite REST API.
 * For now, returns mock data matching the seed dataset.
 */
export async function fetchEventAttendees(
  eventbriteEventId: string,
  _apiKey?: string
): Promise<EventbriteSyncResult> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  const mockData: Record<string, EventbriteAttendee[]> = {
    // Melbourne event
    '1988138282121': [
      { id: 'ATT-001-1', order_id: 'ORD-001', quantity: 3, status: 'valid',    created: '2026-07-01T10:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-001-2', order_id: 'ORD-001', quantity: 3, status: 'valid',    created: '2026-07-01T10:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-002-1', order_id: 'ORD-002', quantity: 2, status: 'valid',    created: '2026-07-05T14:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-003-1', order_id: 'ORD-003', quantity: 1, status: 'valid',    created: '2026-07-10T09:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-004-1', order_id: 'ORD-004', quantity: 2, status: 'valid',    created: '2026-07-15T11:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-005-1', order_id: 'ORD-005', quantity: 3, status: 'valid',    created: '2026-07-20T16:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-006-1', order_id: 'ORD-006', quantity: 2, status: 'refunded', created: '2026-07-22T08:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-007-1', order_id: 'ORD-007', quantity: 1, status: 'comp',     created: '2026-07-25T12:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-008-1', order_id: 'ORD-008', quantity: 1, status: 'test',     created: '2026-07-26T09:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-201-1', order_id: 'ORD-201', quantity: 2, status: 'valid',    created: '2026-07-03T11:00:00+10:00', promo_code: 'JAKE' },
      { id: 'ATT-202-1', order_id: 'ORD-202', quantity: 3, status: 'valid',    created: '2026-07-14T14:00:00+10:00', promo_code: 'JAKE' },
      { id: 'ATT-301-1', order_id: 'ORD-301', quantity: 5, status: 'valid',    created: '2026-07-02T10:00:00+10:00', promo_code: 'MAYA' },
      { id: 'ATT-302-1', order_id: 'ORD-302', quantity: 5, status: 'valid',    created: '2026-07-06T12:00:00+10:00', promo_code: 'MAYA' },
      { id: 'ATT-303-1', order_id: 'ORD-303', quantity: 4, status: 'valid',    created: '2026-07-11T09:00:00+10:00', promo_code: 'MAYA' },
      { id: 'ATT-304-1', order_id: 'ORD-304', quantity: 4, status: 'valid',    created: '2026-07-16T15:00:00+10:00', promo_code: 'MAYA' },
      { id: 'ATT-305-1', order_id: 'ORD-305', quantity: 4, status: 'valid',    created: '2026-07-21T11:00:00+10:00', promo_code: 'MAYA' },
    ],
    // Sydney event
    '9999999999999': [
      { id: 'ATT-101-1', order_id: 'ORD-101', quantity: 4, status: 'valid',     created: '2026-07-08T13:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-102-1', order_id: 'ORD-102', quantity: 2, status: 'valid',     created: '2026-07-12T15:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-103-1', order_id: 'ORD-103', quantity: 1, status: 'valid',     created: '2026-07-18T10:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-104-1', order_id: 'ORD-104', quantity: 1, status: 'cancelled', created: '2026-07-19T11:00:00+10:00', promo_code: 'CLAIRE' },
      { id: 'ATT-401-1', order_id: 'ORD-401', quantity: 3, status: 'valid',     created: '2026-07-09T14:00:00+10:00', promo_code: 'MAYA' },
    ],
  };

  const attendees = mockData[eventbriteEventId] ?? [];

  return {
    eventId: eventbriteEventId,
    attendees,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Check whether an Eventbrite event is currently live/published.
 * In production this calls the Eventbrite Events API.
 */
export async function isEventLive(
  eventbriteEventId: string,
  _apiKey?: string
): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 100));
  // Both mock events are live
  const liveEvents = new Set(['1988138282121', '9999999999999']);
  return liveEvents.has(eventbriteEventId);
}
