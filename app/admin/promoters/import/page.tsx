'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Skipped {
  row: number;
  name: string;
  email: string;
  reason: string;
}

export default function ImportPromotersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: Skipped[] } | null>(null);

  async function handleUpload() {
    if (!file) return;
    setStatus('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const csv = await file.text();
      const res = await fetch('/api/admin/promoters/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Import failed.');
        return;
      }
      setStatus('done');
      setResult(data);
      setFile(null);
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Try again.');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/promoters" className="label-meta inline-flex items-center gap-1.5 transition-colors hover:text-[#F2F2EE] mb-4 block">
          ← Promoters
        </Link>
        <h1 className="page-title">Import Promoters</h1>
      </div>

      <div className="dark-card p-6 space-y-3">
        <p className="label-meta-2">CSV Format</p>
        <p className="text-sm" style={{ color: '#777' }}>
          First row must be a header with these column names (any order, case-insensitive):
        </p>
        <div className="rounded-lg px-4 py-3 font-mono text-xs" style={{ background: '#111', border: '1px solid #1E1E1E', color: '#B7FF00' }}>
          name,email,phone,instagram,city,state,notes,promo_code
        </div>
        <ul className="text-xs space-y-1" style={{ color: '#555' }}>
          <li><span style={{ color: '#888' }}>name</span> and <span style={{ color: '#888' }}>email</span> are required — rows missing either are skipped.</li>
          <li><span style={{ color: '#888' }}>state</span> must be NSW, VIC, QLD or ACT (blank is fine).</li>
          <li><span style={{ color: '#888' }}>promo_code</span> is optional — if a row already has an existing code (e.g. one they&apos;re already promoting with), include it and it will be kept exactly as given, as long as it&apos;s not already in use. Leave it blank to auto-generate one, same as the self-serve signup form.</li>
          <li>Slug is always auto-generated.</li>
          <li>Each promoter is created active with silent portal access — no email is sent.</li>
        </ul>
      </div>

      <div className="dark-card p-6 space-y-4">
        <p className="label-meta-2">Upload</p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="dark-input"
        />
        <button
          onClick={handleUpload}
          disabled={!file || status === 'loading'}
          className="btn-primary"
        >
          {status === 'loading' ? 'Importing…' : 'Import CSV'}
        </button>

        {status === 'error' && (
          <p className="text-xs" style={{ color: '#FF4444' }}>{errorMsg}</p>
        )}

        {status === 'done' && result && (
          <div className="space-y-3 pt-2" style={{ borderTop: '1px solid #1a1a1a' }}>
            {result.created > 0 && (
              <p className="text-sm" style={{ color: '#B7FF00' }}>
                ✓ Imported {result.created} promoter{result.created === 1 ? '' : 's'}.
              </p>
            )}
            {result.skipped.length > 0 && (
              <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}>
                <p className="font-semibold mb-2" style={{ color: '#FFB400' }}>
                  {result.skipped.length} row{result.skipped.length === 1 ? '' : 's'} skipped
                </p>
                <ul className="space-y-1" style={{ color: '#888' }}>
                  {result.skipped.map((s, i) => (
                    <li key={i}>
                      Row {s.row}{s.name ? ` (${s.name})` : ''}
                      {s.email ? ` — ${s.email}` : ''}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
