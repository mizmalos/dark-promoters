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
    name: 'Billy Elbaba', email: 'bill@gmail.com', phone: '4245245245',
    instagram: null, city: null, state: null,
    notes: null,
    slug: 'billy', promo_code: 'BILLY', is_active: true,
    source: 'admin', welcomed_at: null,
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
    eventbrite_event_id: '1997435168358',
    eventbrite_url: 'https://www.eventbrite.com.au/e/dark-test-automation-tickets-1997435168358',
    is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    name: '240KMH F2F Sydney — October 2026',
    description: 'DARK comes to Sydney for one night only.',
    venue: 'Hordern Pavilion', city: 'Sydney', state: 'NSW',
    event_date: '2026-10-18T20:00:00+11:00',
    eventbrite_event_id: '1997435168358',
    eventbrite_url: 'https://www.eventbrite.com.au/e/dark-test-automation-tickets-1997435168358',
    is_active: true,
    created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00',
  },
];

const PROMOTER_EVENTS: PromoterEvent[] = [
  { id: '33333333-0000-0000-0000-000000000001', promoter_id: '11111111-0000-0000-0000-000000000001', event_id: '22222222-0000-0000-0000-000000000001', link_slug: 'billy-dark', tickets_sold: 0, is_active: true, created_at: '2026-06-01T00:00:00+10:00', updated_at: '2026-06-01T00:00:00+10:00' },
];

const TICKET_SALES: TicketSale[] = [];

const SYNC_LOGS: SyncLog[] = [];

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
