'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/portal');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs font-semibold tracking-widest uppercase transition-colors"
      style={{ color: '#333' }}
      onMouseOver={e => ((e.target as HTMLElement).style.color = '#777')}
      onMouseOut={e => ((e.target as HTMLElement).style.color = '#333')}
    >
      Sign Out
    </button>
  );
}
