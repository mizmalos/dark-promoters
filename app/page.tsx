import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: '#070707' }}>
      <Image src="/hero.jpg" alt="" fill priority className="object-cover" />

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(7,7,7,0.65) 0%, rgba(7,7,7,0.45) 45%, rgba(7,7,7,0.3) 100%)',
        }}
      />

      <div className="relative z-10 text-center px-6">
        <Image src="/dark-logo.png" alt="DARK" width={480} height={87} className="mx-auto mb-10 w-[70vw] max-w-2xl h-auto" priority />
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/admin" className="btn-primary">
            Admin Dashboard
          </Link>
          <Link href="/portal" className="btn-secondary">
            Promoter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
