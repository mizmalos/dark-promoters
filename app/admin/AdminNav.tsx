'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/admin',
    label: 'Overview',
    exact: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/promoters',
    label: 'Promoters',
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/events',
    label: 'Events',
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/admin/sync',
    label: 'Sync',
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-52 flex-col shrink-0 min-h-screen"
        style={{ background: '#070707', borderRight: '1px solid #1a1a1a' }}
      >
        <div className="px-5 pt-7 pb-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <Image src="/dark-logo.png" alt="DARK" width={150} height={27} priority style={{ display: 'block' }} />
          <div className="label-meta mt-2">Admin</div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ href, label, exact, icon }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? '#B7FF00' : '#555555',
                  background: active ? 'rgba(183,255,0,0.06)' : 'transparent',
                }}
              >
                <span style={{ color: active ? '#B7FF00' : '#444444' }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
          <p className="label-meta">AU / Melbourne</p>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ background: '#070707', borderBottom: '1px solid #1a1a1a' }}
      >
        <div className="flex items-center gap-3">
          <Image src="/dark-logo.png" alt="DARK" width={150} height={27} priority />
          <span className="label-meta">Admin</span>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-50"
        style={{ background: '#070707', borderTop: '1px solid #1a1a1a' }}
      >
        {navItems.map(({ href, label, exact, icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
              style={{ color: active ? '#B7FF00' : '#444444' }}
            >
              {icon}
              <span
                className="text-[8px] tracking-widest uppercase font-semibold"
                style={{ color: active ? '#B7FF00' : '#444444' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
