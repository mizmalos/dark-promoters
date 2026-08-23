'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS, type SortValue } from './sortOptions';

export function SortSelect({ value }: { value: SortValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`/admin/promoters?${params.toString()}`);
  }

  return (
    <select value={value} onChange={handleChange} className="dark-select" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
      {SORT_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
