import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchEventAttendees } from '@/lib/eventbrite/mock';
import { deduplicateSales } from '@/lib/utils/tickets';
import type { TicketStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
  const events = (await db.events.list()).filter(e => e.is_active && e.eventbrite_event_id);
  const results = [];

  for (const event of events) {
    try {
      const { attendees } = await fetchEventAttendees(event.eventbrite_event_id!);
      const assignments   = await db.assignments.forEvent(event.id);

      let processed = 0;

      for (const assignment of assignments) {
        const relevant = attendees.filter(
          a => a.promo_code.toUpperCase() === assignment.promoter.promo_code.toUpperCase()
        );

        // Dedup before upsert
        const unique = deduplicateSales(
          relevant.map(a => ({
            id: '',
            promoter_event_id: assignment.id,
            eventbrite_order_id: a.order_id,
            eventbrite_attendee_id: a.id,
            quantity: a.quantity,
            status: a.status as TicketStatus,
            order_date: a.created,
            synced_at: new Date().toISOString(),
          }))
        );

        for (const sale of unique) {
          await db.sales.upsert(sale);
          processed++;
        }

        // Recompute cached tickets_sold (valid only)
        const allSales = await db.sales.forAssignment(assignment.id);
        const validCount = allSales.filter(s => s.status === 'valid').reduce((sum, s) => sum + s.quantity, 0);
        await db.assignments.update(assignment.id, { tickets_sold: validCount });
      }

      await db.syncLogs.add({ event_id: event.id, sync_type: 'manual', status: 'success', records_processed: processed, error_message: null });
      results.push({ event: event.name, status: 'success', records: processed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await db.syncLogs.add({ event_id: event.id, sync_type: 'manual', status: 'error', records_processed: 0, error_message: msg });
      results.push({ event: event.name, status: 'error', error: msg });
    }
  }

  // Redirect back to sync page for form submissions
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(new URL('/admin/sync', req.url));
  }

  return NextResponse.json({ results });
}
