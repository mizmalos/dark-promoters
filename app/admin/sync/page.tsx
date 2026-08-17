import { db } from '@/lib/db';

export default async function SyncPage() {
  const [logs, events] = await Promise.all([db.syncLogs.list(), db.events.list()]);

  const lastSync = logs[0] ?? null;
  const lastSyncTime = lastSync
    ? new Date(lastSync.created_at).toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : null;
  const lastSyncDate = lastSync
    ? new Date(lastSync.created_at).toLocaleDateString('en-AU', {
        timeZone: 'Australia/Melbourne', day: 'numeric', month: 'short',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-meta mb-1">Eventbrite</p>
          <h1 className="page-title">Sync</h1>
          <p className="label-meta-2 mt-1">Sync ticket sales &amp; attendee data</p>
        </div>
        <form action="/api/admin/sync" method="POST">
          <button type="submit" className="btn-primary mt-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Sync Now
          </button>
        </form>
      </div>

      {/* ── Last sync status ── */}
      {lastSync && (
        <div className="dark-card p-6" style={{ border: '1px solid rgba(183,255,0,0.1)' }}>
          <p className="label-meta mb-4">Last Sync</p>
          <div className="flex items-end gap-3">
            <span className="font-black text-3xl tracking-tight" style={{ color: '#F2F2EE' }}>{lastSyncTime}</span>
            <span className="label-meta-2 mb-1">{lastSyncDate}</span>
          </div>
          <div className="mt-3">
            <span className={lastSync.status === 'success' ? 'badge-active' : 'badge-inactive'}>
              {lastSync.status}
            </span>
            {lastSync.records_processed != null && (
              <span className="label-meta ml-3">{lastSync.records_processed} records processed</span>
            )}
          </div>
        </div>
      )}

      {/* ── Connected events ── */}
      <div className="dark-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <p className="label-meta-2">Connected Events</p>
        </div>
        {events.length === 0 ? (
          <p className="px-6 py-10 text-sm text-center" style={{ color: '#555' }}>No events configured.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
            {events.map(e => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#F2F2EE' }}>{e.name}</p>
                  <p className="label-meta mt-1">EB ID: {e.eventbrite_event_id ?? 'not set'}</p>
                </div>
                <span className={e.is_active ? 'badge-active' : 'badge-inactive'}>
                  {e.is_active ? 'Live' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sync history ── */}
      <div className="dark-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <p className="label-meta-2">Sync History</p>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: '#111', border: '1px solid #1E1E1E' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: '#555' }}>No sync history yet.</p>
            <p className="label-meta mt-1">Run your first sync to see results here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
            {logs.map(log => {
              const time = new Date(log.created_at).toLocaleTimeString('en-AU', {
                timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false,
              });
              const eventName = events.find(e => e.id === log.event_id)?.name ?? '—';
              return (
                <div key={log.id} className="px-6 py-4 flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold shrink-0" style={{ color: '#555', minWidth: '3.5rem' }}>
                    {time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F2F2EE' }}>{eventName}</p>
                    {log.records_processed != null && (
                      <p className="label-meta mt-0.5">{log.records_processed} attendees synced</p>
                    )}
                    {log.error_message && (
                      <p className="text-xs mt-0.5" style={{ color: '#FF4444' }}>{log.error_message}</p>
                    )}
                  </div>
                  <span className={log.status === 'success' ? 'badge-active' : 'badge-inactive'}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
