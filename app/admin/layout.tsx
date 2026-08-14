import Link from 'next/link';

const navLinks = [
  { href: '/admin',            label: 'Dashboard' },
  { href: '/admin/promoters',  label: 'Promoters' },
  { href: '/admin/events',     label: 'Events' },
  { href: '/admin/sync',       label: 'Sync' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden bg-black text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <span className="text-lg font-black tracking-widest">DARK</span>
          <span className="text-xs text-white/40 ml-2">Admin</span>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-black text-white flex-col shrink-0 min-h-screen">
        <div className="px-6 py-6 border-b border-white/10">
          <span className="text-xl font-black tracking-widest">DARK</span>
          <p className="text-xs text-white/40 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/30">Australia/Melbourne</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black text-white flex border-t border-white/10 z-50">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 text-xs text-white/60 hover:text-white active:text-white transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
