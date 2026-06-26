import { createClient } from '@supabase/supabase-js';
import { requireEnv } from './env.js';

export const supabaseAdmin = createClient(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export function supabaseAuthClient(token: string) {
  return createClient(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('VITE_SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
