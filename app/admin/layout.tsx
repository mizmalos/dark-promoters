import AdminNav from './AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#070707' }}>
      <AdminNav />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
