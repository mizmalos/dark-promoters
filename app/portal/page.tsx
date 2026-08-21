import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import MagicLinkForm from './MagicLinkForm';

interface Props {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function PortalLoginPage({ searchParams }: Props) {
  // Already signed in? Go straight to dashboard
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/portal/dashboard');

  const { error, next } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#070707' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/dark-logo.png" alt="DARK" width={96} height={17} className="mx-auto mb-3" priority />
          <p className="label-meta">Promoter Portal</p>
        </div>

        {/* Auth error banner */}
        {error === 'auth' && (
          <div
            className="mb-6 rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF6666' }}
          >
            That link has expired or is invalid. Request a new one below.
          </div>
        )}

        {/* Magic link form */}
        <MagicLinkForm next={next} />

        {/* Join link */}
        <p className="text-center mt-8 text-xs" style={{ color: '#444' }}>
          Not a promoter yet?{' '}
          <a href="/join" style={{ color: '#777' }} className="transition-colors hover:text-[#F2F2EE]">
            Apply here
          </a>
        </p>
      </div>
    </div>
  );
}
