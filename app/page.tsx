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
        <Image src="/dark-logo.png" alt="DARK" width={320} height={58} className="mx-auto mb-8" priority />
        <p className="label-meta mb-16" style={{ fontSize: '1.24rem' }}>Est 2022</p>
        <div className="flex gap-6 justify-center flex-wrap">
          <Link href="/admin" className="btn-primary" style={{ fontSize: '1.44rem', padding: '20px 40px' }}>
            Admin Dashboard
          </Link>
          <Link href="/portal" className="btn-secondary" style={{ fontSize: '1.44rem', padding: '20px 40px' }}>
            Promoter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
