'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'uses-desc', label: 'Uses (High–Low)' },
  { value: 'uses-asc', label: 'Uses (Low–High)' },
  { value: 'code-asc', label: 'Code (A–Z)' },
  { value: 'code-desc', label: 'Code (Z–A)' },
] as const;

export type SortValue = typeof SORT_OPTIONS[number]['value'];

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
