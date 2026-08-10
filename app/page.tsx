import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl font-black tracking-widest mb-2">DARK</div>
        <p className="text-gray-500 text-sm mb-8">Promoter Management — MVP</p>
        <div className="flex gap-3 justify-center">
          <Link href="/admin"
            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            Admin Dashboard
          </Link>
          <Link href="/portal"
            className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors bg-white">
            Promoter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
