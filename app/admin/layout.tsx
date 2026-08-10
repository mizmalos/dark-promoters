import Link from 'next/link';

const navLinks = [
  { href: '/admin',            label: 'Dashboard' },
  { href: '/admin/promoters',  label: 'Promoters' },
  { href: '/admin/events',     label: 'Events' },
  { href: '/admin/sync',       label: 'Sync Logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-black text-white flex flex-col shrink-0">
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
