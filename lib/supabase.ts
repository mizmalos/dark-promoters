import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only — uses service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Provision a Supabase Auth account for a promoter and email them an invite link.
 * Needed because this project has self-serve signups disabled, so a promoter's
 * first magic-link attempt has nothing to attach to unless an account already
 * exists — the admin API bypasses that restriction (unlike signInWithOtp's
 * shouldCreateUser flag, which doesn't). Safe to call for an email that already
 * has an account — that case is treated as success, not an error.
 */
export async function inviteAuthUser(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dark-promoters.vercel.app'}/auth/callback`;
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error) {
    const alreadyExists = error.message.toLowerCase().includes('already');
    if (alreadyExists) return { ok: true };
    console.error('[inviteAuthUser] Failed for', email, ':', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
