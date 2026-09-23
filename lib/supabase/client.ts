import { createBrowserClient } from '@supabase/ssr';
import { isDemoMode, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Browser-side Supabase client.
 * Only used in Client Components. Safe — uses anon key, protected by RLS.
 * Returns null in demo mode (no env vars set).
 */
export function createClient() {
  if (isDemoMode()) return null;
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}
