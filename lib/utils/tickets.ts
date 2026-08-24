// ============================================================
// DARK — Ticket counting business logic
// All counting is based on ticket QUANTITY, not order count.
// Only 'valid' status tickets are counted toward totals.
// ============================================================

import type { TicketSale, TicketStatus } from '@/lib/types';

/** Statuses that count toward a promoter's valid ticket total */
const VALID_STATUSES: TicketStatus[] = ['valid'];

/** Returns true if a ticket sale should be counted */
export function isValidSale(sale: Pick<TicketSale, 'status'>): boolean {
  return VALID_STATUSES.includes(sale.status as TicketStatus);
}

/**
 * Count total valid tickets from an array of sales.
 * Uses quantity, not order count.
 */
export function countValidTickets(sales: TicketSale[]): number {
  return sales
    .filter(isValidSale)
    .reduce((sum, sale) => sum + sale.quantity, 0);
}

/**
 * Remove duplicate sales by (order_id, attendee_id) pair.
 * Keeps the first occurrence.
 */
export function deduplicateSales<T extends Pick<TicketSale, 'eventbrite_order_id' | 'eventbrite_attendee_id'>>(
  sales: T[]
): T[] {
  const seen = new Set<string>();
  return sales.filter((sale) => {
    const key = `${sale.eventbrite_order_id}::${sale.eventbrite_attendee_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Given a valid ticket count, return how many milestone rewards
 * have been reached (1 reward per 10 valid tickets).
 */
export function countMilestones(validTickets: number, threshold = 10): number {
  return Math.floor(validTickets / threshold);
}

/**
 * Return how many tickets remain until the next milestone.
 */
export function ticketsUntilNextMilestone(validTickets: number, threshold = 10): number {
  return threshold - (validTickets % threshold);
}

/**
 * Commission rules, per event: the first FREE_TICKET_THRESHOLD uses of a
 * promoter's code earn them a free ticket (no cash commission) — every use
 * after that earns COMMISSION_PER_SALE dollars.
 */
export const FREE_TICKET_THRESHOLD = 10;
export const COMMISSION_PER_SALE = 5;

/** Dollar commission earned on a single event, given its use count. */
export function commissionForEvent(uses: number, threshold = FREE_TICKET_THRESHOLD, perSale = COMMISSION_PER_SALE): number {
  return Math.max(0, uses - threshold) * perSale;
}

/** True once a promoter has earned their free ticket on an event. */
export function hasEarnedFreeTicket(uses: number, threshold = FREE_TICKET_THRESHOLD): boolean {
  return uses >= threshold;
}

/** How many more uses on an event until the free-ticket threshold is reached (0 once past it). */
export function usesUntilFreeTicket(uses: number, threshold = FREE_TICKET_THRESHOLD): number {
  return Math.max(0, threshold - uses);
}

/**
 * Generate a suggested link slug from promoter slug + event abbreviation.
 * e.g. ('claire', '240KMH F2F Melbourne September 2026') → 'claire-240kmh'
 */
export function suggestLinkSlug(promoterSlug: string, eventName: string): string {
  const words = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  // Use up to 2 meaningful words from the event name (skip common filler words)
  const fillers = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'at', 'to', 'f2f']);
  const meaningful = words.filter((w) => !fillers.has(w)).slice(0, 1);

  const eventPart = meaningful.join('-') || words[0] || 'event';
  return `${promoterSlug.toLowerCase()}-${eventPart}`;
}

/**
 * Slugify an event name for its admin URL: lowercase, alphanumeric only,
 * no separators. e.g. 'DARK TEST' -> 'darktest'
 */
export function slugifyEventName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Build the full Eventbrite checkout URL with discount code applied.
 * e.g. 'https://www.eventbrite.com.au/e/...' + 'CLAIRE'
 *   → 'https://www.eventbrite.com.au/e/...?discount=CLAIRE'
 */
export function buildEventbriteUrl(baseUrl: string, promoCode: string): string {
  // Strip any existing discount param to avoid duplicates
  const url = new URL(baseUrl);
  url.searchParams.set('discount', promoCode);
  return url.toString();
}

/**
 * Validate a redirect URL is safe (only Eventbrite domains allowed).
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = ['eventbrite.com', 'eventbrite.com.au'];
    return allowed.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
