import Link from 'next/link';
import { db } from '@/lib/mock-db';
import { countValidTickets } from '@/lib/utils/tickets';

const STATE_COLOURS: Record<string, string> = {
  VIC: 'bg-blue-100 text-blue-800',
  NSW: 'bg-green-100 text-green-800',
  QLD: 'bg-yellow-100 text-yellow-800',
  ACT: 'bg-purple-100 text-purple-800',
};

export default function PromotersPage() {
  const promoters = db.promoters.list();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promoters</h1>
          <p className="text-sm text-gray-500 mt-1">{promoters.length} total</p>
        </div>
        <Link href="/admin/promoters/new"
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          + Add Promoter
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {promoters.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">No promoters yet.</p>
            <Link href="/admin/promoters/new" className="mt-3 inline-block text-sm text-black underline">
              Add the first one
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Code', 'City / State', 'Instagram', 'Tickets Sold', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promoters.map(p => {
                const assignments = db.assignments.forPromoter(p.id);
                const sales = assignments.flatMap(a => db.sales.forAssignment(a.id));
                const total = countValidTickets(sales);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-700 font-semibold">{p.promo_code}</td>
                    <td className="px-5 py-3">
                      <div className="text-gray-700">{p.city}</div>
                      {p.state && (
                        <span className={`inline-block mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${STATE_COLOURS[p.state] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.state}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.instagram ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-black text-white">
                        {total}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/promoters/${p.id}`}
                        className="text-sm text-gray-500 hover:text-black">Edit →</Link>
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
