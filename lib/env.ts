/**
 * Environment variable validation.
 * All env access in the app must go through this module.
 * Fails loudly at startup rather than silently returning undefined.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Create a .env.local file in the project root with this variable set.\n` +
      `See README.md for setup instructions.`
    );
  }
  return value;
}

/** Public Supabase URL — safe to expose to the browser */
export function getSupabaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

/** Public anon key — safe to expose to the browser (protected by RLS) */
export function getSupabaseAnonKey(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Service-role key — NEVER expose to browser or client components.
 * Only use in server-side code (Server Actions, Route Handlers, server components).
 */
export function getSupabaseServiceKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

/** Whether we are running in demo/mock mode (no real Supabase connection) */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
