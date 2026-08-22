// ============================================================
// DARK — Supabase Database Layer
// Async version of mock-db.ts — same interface, real data.
// ============================================================

import { supabase } from '@/lib/supabase';
import type {
  Promoter, Event, PromoterEvent, TicketSale, SyncLog,
  PromoterEventWithDetails, EventWithPromoters,
} from '@/lib/types';

export const db = {
  promoters: {
    list: async (): Promise<Promoter[]> => {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string): Promise<Promoter | null> => {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    getBySlug: async (slug: string): Promise<Promoter | null> => {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    getByEmail: async (email: string): Promise<Promoter | null> => {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    create: async (input: Omit<Promoter, 'id' | 'created_at' | 'updated_at' | 'welcomed_at'>): Promise<Promoter> => {
      const { data, error } = await supabase
        .from('promoters')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    update: async (id: string, input: Partial<Promoter>): Promise<Promoter | null> => {
      const { data, error } = await supabase
        .from('promoters')
        .update(input)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    slugExists: async (slug: string, excludeId?: string): Promise<boolean> => {
      let q = supabase.from('promoters').select('id').eq('slug', slug);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return (data?.length ?? 0) > 0;
    },

    codeExists: async (code: string, excludeId?: string): Promise<boolean> => {
      let q = supabase.from('promoters').select('id').ilike('promo_code', code);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return (data?.length ?? 0) > 0;
    },
  },

  events: {
    list: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },

    get: async (id: string): Promise<Event | null> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    create: async (input: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> => {
      const { data, error } = await supabase
        .from('events')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    update: async (id: string, input: Partial<Event>): Promise<Event | null> => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    withPromoters: async (id: string): Promise<EventWithPromoters | null> => {
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (eventErr || !event) return null;

      const { data: pes, error: pesErr } = await supabase
        .from('promoter_events')
        .select('*, promoter:promoters(*), event:events(*)')
        .eq('event_id', id);
      if (pesErr) return null;

      return { ...event, promoter_events: (pes ?? []) as PromoterEventWithDetails[] };
    },
  },

  assignments: {
    forPromoter: async (promoterId: string): Promise<PromoterEventWithDetails[]> => {
      const { data, error } = await supabase
        .from('promoter_events')
        .select('*, promoter:promoters(*), event:events(*)')
        .eq('promoter_id', promoterId);
      if (error) throw error;
      return (data ?? []) as PromoterEventWithDetails[];
    },

    forEvent: async (eventId: string): Promise<PromoterEventWithDetails[]> => {
      const { data, error } = await supabase
        .from('promoter_events')
        .select('*, promoter:promoters(*), event:events(*)')
        .eq('event_id', eventId);
      if (error) throw error;
      return (data ?? []) as PromoterEventWithDetails[];
    },

    getBySlug: async (slug: string): Promise<PromoterEventWithDetails | null> => {
      const { data, error } = await supabase
        .from('promoter_events')
        .select('*, promoter:promoters(*), event:events(*)')
        .eq('link_slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) return null;
      return data as PromoterEventWithDetails | null;
    },

    slugExists: async (slug: string, excludeId?: string): Promise<boolean> => {
      let q = supabase.from('promoter_events').select('id').eq('link_slug', slug);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return (data?.length ?? 0) > 0;
    },

    create: async (promoterId: string, eventId: string, linkSlug: string): Promise<PromoterEventWithDetails> => {
      const { data, error } = await supabase
        .from('promoter_events')
        .insert({ promoter_id: promoterId, event_id: eventId, link_slug: linkSlug })
        .select('*, promoter:promoters(*), event:events(*)')
        .single();
      if (error) throw error;
      return data as PromoterEventWithDetails;
    },

    update: async (id: string, input: Partial<PromoterEvent>): Promise<PromoterEventWithDetails | null> => {
      const { data, error } = await supabase
        .from('promoter_events')
        .update(input)
        .eq('id', id)
        .select('*, promoter:promoters(*), event:events(*)')
        .maybeSingle();
      if (error) return null;
      return data as PromoterEventWithDetails | null;
    },

    remove: async (id: string): Promise<void> => {
      await supabase.from('promoter_events').delete().eq('id', id);
    },
  },

  sales: {
    forAssignment: async (promoterEventId: string): Promise<TicketSale[]> => {
      const { data, error } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('promoter_event_id', promoterEventId);
      if (error) throw error;
      return data ?? [];
    },

    upsert: async (sale: Omit<TicketSale, 'id' | 'synced_at'>): Promise<TicketSale> => {
      const { data, error } = await supabase
        .from('ticket_sales')
        .upsert(sale, { onConflict: 'eventbrite_order_id,eventbrite_attendee_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  syncLogs: {
    list: async (): Promise<SyncLog[]> => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    add: async (log: Omit<SyncLog, 'id' | 'created_at'>): Promise<SyncLog> => {
      const { data, error } = await supabase
        .from('sync_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
};
