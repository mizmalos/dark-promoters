import Link from 'next/link';
import { db } from '@/lib/db';

export default async function EventsPage() {
  const events = await db.events.list();

  // Pre-fetch assignments for all events
  const allAssignments = await Promise.all(events.map(e => db.assignments.forEvent(e.id)));
  const ticketsPerEvent = allAssignments.map(
    assignments => assignments.reduce((sum, a) => sum + a.tickets_sold, 0)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} total</p>
        </div>
        <Link href="/admin/events/new"
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          + Add Event
        </Link>
      </div>

      <div className="space-y-4">
        {events.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">No events yet.</p>
            <Link href="/admin/events/new" className="mt-3 inline-block text-sm text-black underline">
              Create the first one
            </Link>
          </div>
        )}

        {events.map((event, i) => {
          const assignments  = allAssignments[i];
          const totalTickets = ticketsPerEvent[i];

          const eventDate = event.event_date
            ? new Date(event.event_date).toLocaleDateString('en-AU', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                timeZone: 'Australia/Melbourne',
              })
            : null;

          return (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{event.name}</h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {event.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {event.venue && `${event.venue} · `}{event.city}, {event.state}
                    {eventDate && ` · ${eventDate}`}
                  </p>
                </div>
                <Link href={`/admin/events/${event.id}`}
                  className="text-sm text-gray-500 hover:text-black shrink-0 ml-4">
                  Manage →
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm">
                <span className="text-gray-500">{assignments.length} promoter{assignments.length !== 1 ? 's' : ''}</span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">{totalTickets}</span>
                  <span className="text-gray-500">valid tickets</span>
                </span>
                {event.eventbrite_event_id && (
                  <span className="text-xs text-gray-400 font-mono">EB: {event.eventbrite_event_id}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
