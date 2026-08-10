// ============================================================
// DARK — In-Memory Mock Database
//
// Used for the local MVP so the app runs with zero external
// dependencies. When connecting a real Supabase instance,
// replace calls to this module with Supabase client calls.
// ============================================================

import type {
  Promoter, Event, PromoterEvent, TicketSale, SyncLog,
  PromoterEventWithDetails, EventWithPromoters,
} from '@/lib/types';

// ---- Seed data (mirrors supabase/seed.sql) ----

const PROMOTERS: Promoter[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Claire Martin', email: 'claire@example.com', phone: '0411 000 001',
    instagram: '@clairemdark', city: 'Melbourne', state: 'VIC',
    notes: 'Top performer, brings large groups.',
    slug: 'claire', promo_code: 'CLAIRE', is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Jake Torres', email: 'jake@example.com', phone: '0411 000 002',
    instagram: '@jaketdark', city: 'Sydney', state: 'NSW',
    notes: 'Strong social media presence.',
    slug: 'jake', promo_code: 'JAKE', is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Maya Singh', email: 'maya@example.com', phone: '0411 000 003',
    instagram: '@mayadark', city: 'Brisbane', state: 'QLD',
    notes: 'Great reach in QLD market.',
    slug: 'maya', promo_code: 'MAYA', is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
];

const EVENTS: Event[] = [
  {
    id: '22222222-0000-0000-0000-000000000001',
    name: '240KMH F2F Melbourne — September 2026',
    description: 'The biggest DARK event of the year hits Melbourne.',
    venue: 'Festival Hall', city: 'Melbourne', state: 'VIC',
    event_date: '2026-09-20T20:00:00+10:00',
    eventbrite_event_id: '1988138282121',
    eventbrite_url: 'https://www.eventbrite.com.au/e/240kmh-f2f-melbourne-september-2026-tickets-1988138282121',
    is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    name: '240KMH F2F Sydney — October 2026',
    description: 'DARK comes to Sydney for one night only.',
    venue: 'Hordern Pavilion', city: 'Sydney', state: 'NSW',
    event_date: '2026-10-18T20:00:00+11:00',
    eventbrite_event_id: '9999999999999',
    eventbrite_url: 'https://www.eventbrite.com.au/e/240kmh-f2f-sydney-october-2026-tickets-9999999999999',
    is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
];

const PROMOTER_EVENTS: PromoterEvent[] = [
  { id: '33333333-0000-0000-0000-000000000001', promoter_id: '11111111-0000-0000-0000-000000000001', event_id: '22222222-0000-0000-0000-000000000001', link_slug: 'claire-240kmh',  tickets_sold: 14, is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
  { id: '33333333-0000-0000-0000-000000000002', promoter_id: '11111111-0000-0000-0000-000000000001', event_id: '22222222-0000-0000-0000-000000000002', link_slug: 'claire-f2f-syd', tickets_sold: 7,  is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
  { id: '33333333-0000-0000-0000-000000000003', promoter_id: '11111111-0000-0000-0000-000000000002', event_id: '22222222-0000-0000-0000-000000000001', link_slug: 'jake-240kmh',    tickets_sold: 5,  is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
  { id: '33333333-0000-0000-0000-000000000004', promoter_id: '11111111-0000-0000-0000-000000000003', event_id: '22222222-0000-0000-0000-000000000001', link_slug: 'maya-240kmh',    tickets_sold: 22, is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
  { id: '33333333-0000-0000-0000-000000000005', promoter_id: '11111111-0000-0000-0000-000000000003', event_id: '22222222-0000-0000-0000-000000000002', link_slug: 'maya-f2f-syd',   tickets_sold: 3,  is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
];

const TICKET_SALES: TicketSale[] = [
  // Claire / Melbourne — 14 valid
  { id: 's1',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-001-1', quantity: 3, status: 'valid',     order_date: '2026-07-01T10:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's2',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-001', eventbrite_attendee_id: 'ATT-001-2', quantity: 3, status: 'valid',     order_date: '2026-07-01T10:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's3',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-002', eventbrite_attendee_id: 'ATT-002-1', quantity: 2, status: 'valid',     order_date: '2026-07-05T14:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's4',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-003', eventbrite_attendee_id: 'ATT-003-1', quantity: 1, status: 'valid',     order_date: '2026-07-10T09:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's5',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-004', eventbrite_attendee_id: 'ATT-004-1', quantity: 2, status: 'valid',     order_date: '2026-07-15T11:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's6',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-005', eventbrite_attendee_id: 'ATT-005-1', quantity: 3, status: 'valid',     order_date: '2026-07-20T16:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's7',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-006', eventbrite_attendee_id: 'ATT-006-1', quantity: 2, status: 'refunded',  order_date: '2026-07-22T08:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's8',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-007', eventbrite_attendee_id: 'ATT-007-1', quantity: 1, status: 'comp',      order_date: '2026-07-25T12:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's9',  promoter_event_id: '33333333-0000-0000-0000-000000000001', eventbrite_order_id: 'ORD-008', eventbrite_attendee_id: 'ATT-008-1', quantity: 1, status: 'test',      order_date: '2026-07-26T09:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  // Claire / Sydney — 7 valid
  { id: 's10', promoter_event_id: '33333333-0000-0000-0000-000000000002', eventbrite_order_id: 'ORD-101', eventbrite_attendee_id: 'ATT-101-1', quantity: 4, status: 'valid',     order_date: '2026-07-08T13:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's11', promoter_event_id: '33333333-0000-0000-0000-000000000002', eventbrite_order_id: 'ORD-102', eventbrite_attendee_id: 'ATT-102-1', quantity: 2, status: 'valid',     order_date: '2026-07-12T15:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's12', promoter_event_id: '33333333-0000-0000-0000-000000000002', eventbrite_order_id: 'ORD-103', eventbrite_attendee_id: 'ATT-103-1', quantity: 1, status: 'valid',     order_date: '2026-07-18T10:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's13', promoter_event_id: '33333333-0000-0000-0000-000000000002', eventbrite_order_id: 'ORD-104', eventbrite_attendee_id: 'ATT-104-1', quantity: 1, status: 'cancelled', order_date: '2026-07-19T11:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  // Jake / Melbourne — 5 valid
  { id: 's14', promoter_event_id: '33333333-0000-0000-0000-000000000003', eventbrite_order_id: 'ORD-201', eventbrite_attendee_id: 'ATT-201-1', quantity: 2, status: 'valid',     order_date: '2026-07-03T11:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's15', promoter_event_id: '33333333-0000-0000-0000-000000000003', eventbrite_order_id: 'ORD-202', eventbrite_attendee_id: 'ATT-202-1', quantity: 3, status: 'valid',     order_date: '2026-07-14T14:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  // Maya / Melbourne — 22 valid
  { id: 's16', promoter_event_id: '33333333-0000-0000-0000-000000000004', eventbrite_order_id: 'ORD-301', eventbrite_attendee_id: 'ATT-301-1', quantity: 5, status: 'valid',     order_date: '2026-07-02T10:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's17', promoter_event_id: '33333333-0000-0000-0000-000000000004', eventbrite_order_id: 'ORD-302', eventbrite_attendee_id: 'ATT-302-1', quantity: 5, status: 'valid',     order_date: '2026-07-06T12:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's18', promoter_event_id: '33333333-0000-0000-0000-000000000004', eventbrite_order_id: 'ORD-303', eventbrite_attendee_id: 'ATT-303-1', quantity: 4, status: 'valid',     order_date: '2026-07-11T09:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's19', promoter_event_id: '33333333-0000-0000-0000-000000000004', eventbrite_order_id: 'ORD-304', eventbrite_attendee_id: 'ATT-304-1', quantity: 4, status: 'valid',     order_date: '2026-07-16T15:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  { id: 's20', promoter_event_id: '33333333-0000-0000-0000-000000000004', eventbrite_order_id: 'ORD-305', eventbrite_attendee_id: 'ATT-305-1', quantity: 4, status: 'valid',     order_date: '2026-07-21T11:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
  // Maya / Sydney — 3 valid
  { id: 's21', promoter_event_id: '33333333-0000-0000-0000-000000000005', eventbrite_order_id: 'ORD-401', eventbrite_attendee_id: 'ATT-401-1', quantity: 3, status: 'valid',     order_date: '2026-07-09T14:00:00+10:00', synced_at: '2026-07-27T00:00:00+10:00' },
];

const SYNC_LOGS: SyncLog[] = [
  { id: 'log1', event_id: '22222222-0000-0000-0000-000000000001', sync_type: 'manual', status: 'success', records_processed: 9,  error_message: null, created_at: '2026-07-27T09:00:00+10:00' },
  { id: 'log2', event_id: '22222222-0000-0000-0000-000000000002', sync_type: 'manual', status: 'success', records_processed: 4,  error_message: null, created_at: '2026-07-27T09:01:00+10:00' },
];

// ---- In-memory mutable store ----

let promoters  = [...PROMOTERS];
let events     = [...EVENTS];
let promoterEvents = [...PROMOTER_EVENTS];
let ticketSales    = [...TICKET_SALES];
let syncLogs       = [...SYNC_LOGS];

// ---- Helpers ----

function now() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }

function enrich(pe: PromoterEvent): PromoterEventWithDetails {
  return {
    ...pe,
    promoter: promoters.find(p => p.id === pe.promoter_id)!,
    event:    events.find(e => e.id === pe.event_id)!,
  };
}

// ---- Promoter queries ----

export const db = {
  promoters: {
    list: () => [...promoters].sort((a, b) => a.name.localeCompare(b.name)),
    get:  (id: string) => promoters.find(p => p.id === id) ?? null,
    getBySlug: (slug: string) => promoters.find(p => p.slug === slug) ?? null,
    create: (data: Omit<Promoter, 'id' | 'created_at' | 'updated_at'>) => {
      const p: Promoter = { ...data, id: uuid(), created_at: now(), updated_at: now() };
      promoters.push(p);
      return p;
    },
    update: (id: string, data: Partial<Promoter>) => {
      const idx = promoters.findIndex(p => p.id === id);
      if (idx === -1) return null;
      promoters[idx] = { ...promoters[idx], ...data, updated_at: now() };
      return promoters[idx];
    },
    slugExists: (slug: string, excludeId?: string) =>
      promoters.some(p => p.slug === slug && p.id !== excludeId),
    codeExists: (code: string, excludeId?: string) =>
      promoters.some(p => p.promo_code.toUpperCase() === code.toUpperCase() && p.id !== excludeId),
  },

  events: {
    list: () => [...events].sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? '')),
    get:  (id: string) => events.find(e => e.id === id) ?? null,
    create: (data: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
      const e: Event = { ...data, id: uuid(), created_at: now(), updated_at: now() };
      events.push(e);
      return e;
    },
    update: (id: string, data: Partial<Event>) => {
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) return null;
      events[idx] = { ...events[idx], ...data, updated_at: now() };
      return events[idx];
    },
    withPromoters: (id: string): EventWithPromoters | null => {
      const event = events.find(e => e.id === id);
      if (!event) return null;
      return {
        ...event,
        promoter_events: promoterEvents
          .filter(pe => pe.event_id === id)
          .map(enrich),
      };
    },
  },

  assignments: {
    forPromoter: (promoterId: string) =>
      promoterEvents.filter(pe => pe.promoter_id === promoterId).map(enrich),
    forEvent: (eventId: string) =>
      promoterEvents.filter(pe => pe.event_id === eventId).map(enrich),
    getBySlug: (slug: string) => {
      const pe = promoterEvents.find(pe => pe.link_slug === slug && pe.is_active);
      return pe ? enrich(pe) : null;
    },
    slugExists: (slug: string, excludeId?: string) =>
      promoterEvents.some(pe => pe.link_slug === slug && pe.id !== excludeId),
    create: (promoterId: string, eventId: string, linkSlug: string) => {
      const pe: PromoterEvent = {
        id: uuid(), promoter_id: promoterId, event_id: eventId,
        link_slug: linkSlug, tickets_sold: 0, is_active: true,
        created_at: now(), updated_at: now(),
      };
      promoterEvents.push(pe);
      return enrich(pe);
    },
    update: (id: string, data: Partial<PromoterEvent>) => {
      const idx = promoterEvents.findIndex(pe => pe.id === id);
      if (idx === -1) return null;
      promoterEvents[idx] = { ...promoterEvents[idx], ...data, updated_at: now() };
      return enrich(promoterEvents[idx]);
    },
    remove: (id: string) => {
      promoterEvents = promoterEvents.filter(pe => pe.id !== id);
    },
  },

  sales: {
    forAssignment: (promoterEventId: string) =>
      ticketSales.filter(s => s.promoter_event_id === promoterEventId),
    upsert: (sale: Omit<TicketSale, 'id' | 'synced_at'>) => {
      const existing = ticketSales.find(
        s => s.eventbrite_order_id === sale.eventbrite_order_id &&
             s.eventbrite_attendee_id === sale.eventbrite_attendee_id
      );
      if (existing) {
        Object.assign(existing, { ...sale, synced_at: now() });
        return existing;
      }
      const newSale: TicketSale = { ...sale, id: uuid(), synced_at: now() };
      ticketSales.push(newSale);
      return newSale;
    },
  },

  syncLogs: {
    list: () => [...syncLogs].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    add:  (log: Omit<SyncLog, 'id' | 'created_at'>) => {
      const entry: SyncLog = { ...log, id: uuid(), created_at: now() };
      syncLogs.unshift(entry);
      return entry;
    },
  },

  /** Reset to seed data (useful in tests) */
  _reset: () => {
    promoters      = [...PROMOTERS];
    events         = [...EVENTS];
    promoterEvents = [...PROMOTER_EVENTS];
    ticketSales    = [...TICKET_SALES];
    syncLogs       = [...SYNC_LOGS];
  },
};
