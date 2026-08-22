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
 * Silently provision a Supabase Auth account for a promoter — no email sent.
 * Needed because this project has self-serve signups disabled, so a promoter's
 * first magic-link attempt has nothing to attach to unless an account already
 * exists — the admin API bypasses that restriction (unlike signInWithOtp's
 * shouldCreateUser flag, which doesn't). Their first email ends up being the
 * normal magic-link email whenever sign-in is actually requested, rather than
 * a separate invite link up front. Safe to call for an email that already has
 * an account — that case is treated as success, not an error.
 */
export async function ensureAuthUser(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.auth.admin.createUser({ email, email_confirm: true });

  if (error) {
    const alreadyExists = error.message.toLowerCase().includes('already');
    if (alreadyExists) return { ok: true };
    console.error('[ensureAuthUser] Failed for', email, ':', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
