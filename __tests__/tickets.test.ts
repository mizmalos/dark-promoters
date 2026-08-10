import { describe, it, expect, beforeEach } from 'vitest';
import {
  countValidTickets,
  deduplicateSales,
  countMilestones,
  ticketsUntilNextMilestone,
  buildEventbriteUrl,
  isSafeRedirectUrl,
  suggestLinkSlug,
  isValidSale,
} from '../lib/utils/tickets';
import type { TicketSale } from '../lib/types';

// ---- Helpers ----
function sale(overrides: Partial<TicketSale> = {}): TicketSale {
  return {
    id: 'test-id',
    promoter_event_id: 'pe-1',
    eventbrite_order_id: 'ORD-001',
    eventbrite_attendee_id: 'ATT-001',
    quantity: 1,
    status: 'valid',
    order_date: '2026-07-01T10:00:00+10:00',
    synced_at: '2026-07-01T10:00:00+10:00',
    ...overrides,
  };
}

// ============================================================
// isValidSale
// ============================================================
describe('isValidSale', () => {
  it('returns true for valid status', () => {
    expect(isValidSale(sale({ status: 'valid' }))).toBe(true);
  });

  it.each(['refunded', 'cancelled', 'comp', 'test'] as const)(
    'returns false for %s status',
    (status) => {
      expect(isValidSale(sale({ status }))).toBe(false);
    }
  );
});

// ============================================================
// countValidTickets
// ============================================================
describe('countValidTickets', () => {
  it('counts zero when no sales', () => {
    expect(countValidTickets([])).toBe(0);
  });

  it('counts ticket quantity, not order count', () => {
    const sales = [
      sale({ quantity: 3, status: 'valid' }),
      sale({ quantity: 2, status: 'valid', eventbrite_attendee_id: 'ATT-002' }),
    ];
    expect(countValidTickets(sales)).toBe(5);
  });

  it('excludes refunded tickets', () => {
    const sales = [
      sale({ quantity: 5, status: 'valid' }),
      sale({ quantity: 2, status: 'refunded', eventbrite_attendee_id: 'ATT-002' }),
    ];
    expect(countValidTickets(sales)).toBe(5);
  });

  it('excludes cancelled tickets', () => {
    const sales = [sale({ quantity: 3, status: 'cancelled' })];
    expect(countValidTickets(sales)).toBe(0);
  });

  it('excludes comp tickets', () => {
    const sales = [sale({ quantity: 2, status: 'comp' })];
    expect(countValidTickets(sales)).toBe(0);
  });

  it('excludes test tickets', () => {
    const sales = [sale({ quantity: 1, status: 'test' })];
    expect(countValidTickets(sales)).toBe(0);
  });

  it('handles a mix of valid and invalid statuses', () => {
    const sales = [
      sale({ quantity: 3, status: 'valid',     eventbrite_attendee_id: 'A1' }),
      sale({ quantity: 3, status: 'valid',     eventbrite_attendee_id: 'A2' }),
      sale({ quantity: 2, status: 'refunded',  eventbrite_attendee_id: 'A3' }),
      sale({ quantity: 1, status: 'comp',      eventbrite_attendee_id: 'A4' }),
      sale({ quantity: 1, status: 'test',      eventbrite_attendee_id: 'A5' }),
    ];
    // valid = 3 + 3 = 6
    expect(countValidTickets(sales)).toBe(6);
  });

  it('handles multi-ticket single orders correctly', () => {
    // One order with 10 tickets — should count as 10, not 1
    const sales = [sale({ quantity: 10 })];
    expect(countValidTickets(sales)).toBe(10);
  });
});

// ============================================================
// deduplicateSales
// ============================================================
describe('deduplicateSales', () => {
  it('removes exact duplicates by order+attendee key', () => {
    const sales = [
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-001' }),
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-001' }), // duplicate
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-002' }), // different attendee
    ];
    expect(deduplicateSales(sales)).toHaveLength(2);
  });

  it('keeps sales with same order but different attendees', () => {
    const sales = [
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-001' }),
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-002' }),
      sale({ eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-003' }),
    ];
    expect(deduplicateSales(sales)).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateSales([])).toHaveLength(0);
  });

  it('preserves the first occurrence', () => {
    const first  = sale({ quantity: 5, status: 'valid' });
    const second = sale({ quantity: 5, status: 'refunded' }); // same key, different status
    const result = deduplicateSales([first, second]);
    expect(result[0].status).toBe('valid');
  });
});

// ============================================================
// Milestone counting
// ============================================================
describe('countMilestones', () => {
  it('returns 0 below threshold', () => {
    expect(countMilestones(9)).toBe(0);
  });

  it('returns 1 at threshold', () => {
    expect(countMilestones(10)).toBe(1);
  });

  it('returns 2 at 20 tickets', () => {
    expect(countMilestones(20)).toBe(2);
  });

  it('returns 2 at 29 tickets (not yet at 30)', () => {
    expect(countMilestones(29)).toBe(2);
  });

  it('returns 3 at 30 tickets', () => {
    expect(countMilestones(30)).toBe(3);
  });

  it('supports custom threshold', () => {
    expect(countMilestones(25, 5)).toBe(5);
  });
});

describe('ticketsUntilNextMilestone', () => {
  it('returns 10 at 0 tickets', () => {
    expect(ticketsUntilNextMilestone(0)).toBe(10);
  });

  it('returns 6 at 4 tickets', () => {
    expect(ticketsUntilNextMilestone(4)).toBe(6);
  });

  it('returns 10 at exactly a milestone (resets)', () => {
    expect(ticketsUntilNextMilestone(10)).toBe(10);
  });

  it('returns 1 at 19 tickets', () => {
    expect(ticketsUntilNextMilestone(19)).toBe(1);
  });
});

// ============================================================
// URL construction
// ============================================================
describe('buildEventbriteUrl', () => {
  it('appends discount param correctly', () => {
    const url = buildEventbriteUrl(
      'https://www.eventbrite.com.au/e/event-tickets-123',
      'CLAIRE'
    );
    expect(url).toBe('https://www.eventbrite.com.au/e/event-tickets-123?discount=CLAIRE');
  });

  it('replaces existing discount param (no duplicates)', () => {
    const url = buildEventbriteUrl(
      'https://www.eventbrite.com.au/e/event-tickets-123?discount=OLD',
      'CLAIRE'
    );
    expect(url).not.toContain('OLD');
    expect(url).toContain('discount=CLAIRE');
  });

  it('preserves other query params', () => {
    const url = buildEventbriteUrl(
      'https://www.eventbrite.com.au/e/event-tickets-123?aff=test',
      'CLAIRE'
    );
    expect(url).toContain('aff=test');
    expect(url).toContain('discount=CLAIRE');
  });
});

// ============================================================
// Redirect safety
// ============================================================
describe('isSafeRedirectUrl', () => {
  it('allows eventbrite.com', () => {
    expect(isSafeRedirectUrl('https://www.eventbrite.com/e/event-123')).toBe(true);
  });

  it('allows eventbrite.com.au', () => {
    expect(isSafeRedirectUrl('https://www.eventbrite.com.au/e/event-123')).toBe(true);
  });

  it('blocks non-Eventbrite domains', () => {
    expect(isSafeRedirectUrl('https://evil.com/phishing')).toBe(false);
  });

  it('blocks Eventbrite-lookalike domains', () => {
    expect(isSafeRedirectUrl('https://eventbrite.com.evil.com/e/123')).toBe(false);
  });

  it('blocks invalid URLs', () => {
    expect(isSafeRedirectUrl('not-a-url')).toBe(false);
  });

  it('blocks javascript: protocol', () => {
    expect(isSafeRedirectUrl('javascript:alert(1)')).toBe(false);
  });
});

// ============================================================
// Slug suggestion
// ============================================================
describe('suggestLinkSlug', () => {
  it('generates slug from promoter slug + event name', () => {
    const slug = suggestLinkSlug('claire', '240KMH F2F Melbourne September 2026');
    expect(slug).toMatch(/^claire-/);
    expect(slug).toBe('claire-240kmh');
  });

  it('handles short event names', () => {
    const slug = suggestLinkSlug('jake', 'Rave');
    expect(slug).toMatch(/^jake-/);
  });

  it('lowercases everything', () => {
    const slug = suggestLinkSlug('MAYA', 'BIG EVENT');
    expect(slug).toBe(slug.toLowerCase());
  });
});
