import { NextResponse } from 'next/server';

// Temporary debug endpoint — delete after diagnosis
export async function GET() {
  return NextResponse.json({
    RAILRADAR_API_KEY_present: !!process.env.RAILRADAR_API_KEY,
    RAILRADAR_API_KEY_length: process.env.RAILRADAR_API_KEY?.length ?? 0,
    RAILRADAR_API_KEY_prefix: process.env.RAILRADAR_API_KEY?.slice(0, 8) ?? '(not set)',
    NEXT_PUBLIC_SUPABASE_URL_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
}
