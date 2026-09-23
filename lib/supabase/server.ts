import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isDemoMode, getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceKey } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Server-side Supabase client with user session (anon key + cookies).
 * Use for user-scoped data — respects RLS.
 * Returns null in demo mode.
 */
export async function createClient() {
  if (isDemoMode()) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — session refresh handled by middleware
          }
        },
      },
    }
  );
}

/**
 * Server-side admin client with service-role key.
 * ONLY for server-side trusted operations (seeding, admin actions).
 * NEVER import or call this from client components.
 * Returns null in demo mode.
 */
export function createAdminClient() {
  if (isDemoMode()) return null;
  return createSupabaseAdminClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
}
