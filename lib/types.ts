// ============================================================
// DARK Promoter Management — Core Types
// ============================================================

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'ACT';

export type TicketStatus = 'valid' | 'refunded' | 'cancelled' | 'comp' | 'test';

export type UserRole = 'admin' | 'promoter';

export type SyncType = 'manual' | 'scheduled';

export type SyncStatus = 'success' | 'error' | 'partial';

// ---- Database row types ----

export interface Promoter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  city: string | null;
  state: AustralianState | null;
  notes: string | null;
  slug: string;
  promo_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: AustralianState | null;
  event_date: string | null;
  eventbrite_event_id: string | null;
  eventbrite_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoterEvent {
  id: string;
  promoter_id: string;
  event_id: string;
  link_slug: string;
  tickets_sold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketSale {
  id: string;
  promoter_event_id: string;
  eventbrite_order_id: string;
  eventbrite_attendee_id: string;
  quantity: number;
  status: TicketStatus;
  order_date: string | null;
  synced_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  promoter_id: string | null;
  created_at: string;
}

export interface SyncLog {
  id: string;
  event_id: string | null;
  sync_type: SyncType;
  status: SyncStatus;
  records_processed: number | null;
  error_message: string | null;
  created_at: string;
}

// ---- Joined / enriched types used in the UI ----

export interface PromoterEventWithDetails extends PromoterEvent {
  promoter: Promoter;
  event: Event;
}

export interface PromoterWithEvents extends Promoter {
  promoter_events: PromoterEventWithDetails[];
}

export interface EventWithPromoters extends Event {
  promoter_events: PromoterEventWithDetails[];
}

// ---- Form input types ----

export interface PromoterFormData {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  city: string;
  state: AustralianState | '';
  notes: string;
  slug: string;
  promo_code: string;
}

export interface EventFormData {
  name: string;
  description: string;
  venue: string;
  city: string;
  state: AustralianState | '';
  event_date: string;
  eventbrite_event_id: string;
  eventbrite_url: string;
}

// ---- Eventbrite mock interface types ----

export interface EventbriteAttendee {
  id: string;
  order_id: string;
  quantity: number;
  status: TicketStatus;
  created: string;
  promo_code: string;
}

export interface EventbriteSyncResult {
  eventId: string;
  attendees: EventbriteAttendee[];
  fetchedAt: string;
}
