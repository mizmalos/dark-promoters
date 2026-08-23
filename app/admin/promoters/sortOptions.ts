export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'uses-desc', label: 'Uses (High–Low)' },
  { value: 'uses-asc', label: 'Uses (Low–High)' },
  { value: 'code-asc', label: 'Code (A–Z)' },
  { value: 'code-desc', label: 'Code (Z–A)' },
] as const;

export type SortValue = typeof SORT_OPTIONS[number]['value'];
