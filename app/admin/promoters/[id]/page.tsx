import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/mock-db';
import { countValidTickets, buildEventbriteUrl } from '@/lib/utils/tickets';

const STATES = ['NSW', 'VIC', 'QLD', 'ACT'];

export default function PromoterDetailPage({ params }: { params: { id: string } }) {
  const promoter = db.promoters.get(params.id);
  if (!promoter) notFound();

  const assignments = db.assignments.forPromoter(promoter.id);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/promoters" className="text-sm text-gray-500 hover:text-black">← Promoters</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{promoter.name}</h1>
        <p className="text-sm text-gray-500">Promo code: <span className="font-mono font-semibold text-gray-800">{promoter.promo_code}</span></p>
      </div>

      {/* Promoter details form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Info label="Email"     value={promoter.email} />
          <Info label="Phone"     value={promoter.phone} />
          <Info label="Instagram" value={promoter.instagram} />
          <Info label="City"      value={promoter.city} />
          <Info label="State"     value={promoter.state} />
          <Info label="Slug"      value={promoter.slug} mono />
          <Info label="Status"    value={promoter.is_active ? 'Active' : 'Inactive'} />
        </div>
        {promoter.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700">{promoter.notes}</p>
          </div>
        )}
        <div className="mt-5 pt-4 border-t border-gray-100 flex gap-3">
          <Link href="#" className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Edit Details
          </Link>
          <Link href={`/m/${assignments[0]?.link_slug ?? ''}`} target="_blank"
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Preview Link ↗
          </Link>
        </div>
      </div>

      {/* Per-event breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Event Assignments</h2>
          <span className="text-xs text-gray-400">{assignments.length} event{assignments.length !== 1 ? 's' : ''}</span>
        </div>

        {assignments.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center">Not assigned to any events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Event', 'Valid Tickets', 'Short Link', 'Eventbrite URL', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map(a => {
                const sales   = db.sales.forAssignment(a.id);
                const tickets = countValidTickets(sales);
                const ebUrl   = buildEventbriteUrl(a.event.eventbrite_url, promoter.promo_code);
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{a.event.name}</div>
                      <div className="text-xs text-gray-400">{a.event.city}, {a.event.state}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">
                        {tickets}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      tickets.dark.com/m/{a.link_slug}
                    </td>
                    <td className="px-5 py-3">
                      <a href={ebUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block max-w-xs">
                        Eventbrite ↗
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`mt-0.5 text-gray-900 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  );
}
