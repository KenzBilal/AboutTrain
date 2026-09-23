import { NextResponse } from 'next/server';
import { getAvailabilityProvider } from '@/lib/railway/provider';
import { isDemoMode } from '@/lib/env';

// Temporary debug endpoint — delete after diagnosis
export async function GET() {
  const apiKey = process.env.RAILRADAR_API_KEY;
  const availProvider = getAvailabilityProvider();

  // Call RailRadar directly with train 12014 (known working)
  let railRadarDirect: unknown = null;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.railradar.in/v1/trains/12014/seats?from=PGW&to=NDLS&class=CC&quota=GN&date=2026-10-01`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
          cache: 'no-store',
        }
      );
      const data = await res.json();
      railRadarDirect = { status: res.status, success: data.success, error: data.error, firstDate: data.data?.calendar?.[0] };
    } catch (e) {
      railRadarDirect = { error: String(e) };
    }
  }

  // Call via provider
  let providerResult: unknown = null;
  if (availProvider) {
    try {
      providerResult = await availProvider.getAvailability({
        trainId: '12014',
        fromStation: 'PGW',
        toStation: 'NDLS',
        journeyDate: '2026-10-01',
        classCode: 'CC',
        quota: 'GN',
      });
    } catch (e) {
      providerResult = { error: String(e) };
    }
  }

  return NextResponse.json({
    RAILRADAR_API_KEY_present: !!apiKey,
    RAILRADAR_API_KEY_length: apiKey?.length ?? 0,
    RAILRADAR_API_KEY_prefix: apiKey?.slice(0, 8) ?? '(not set)',
    NEXT_PUBLIC_SUPABASE_URL_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    isDemoMode: isDemoMode(),
    availProviderName: availProvider ? (availProvider as { providerName?: string }).providerName : null,
    railRadarDirect,
    providerResult,
  });
}
