import { db } from '@/lib/db';

export default async function SyncPage() {
  const [logs, events] = await Promise.all([
    db.syncLogs.list(),
    db.events.list(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Eventbrite data sync history</p>
        </div>
        <form action="/api/admin/sync" method="POST">
          <button type="submit"
            className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sync Now (Mock)
          </button>
        </form>
      </div>

      {/* Events sync status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {events.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {e.is_active ? 'Live' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">EB ID: {e.eventbrite_event_id ?? 'not set'}</p>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sync History</h2>
        </div>

        {logs.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center">No sync history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Records</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => {
                  const time  = new Date(log.created_at).toLocaleString('en-AU', {
                    timeZone: 'Australia/Melbourne', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">{time}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-gray-700">{(events.find(e => e.id === log.event_id))?.name ?? '—'}</td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{log.sync_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'error'   ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-gray-600">{log.records_processed ?? '—'}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-red-600 text-xs">{log.error_message ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
