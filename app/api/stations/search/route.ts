import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/railway/provider';

/**
 * Basic in-memory rate limiter.
 * In a multi-region or serverless edge deployment, use Redis (Upstash) instead.
 */
const rateLimit = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

  const record = rateLimit.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimit.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * GET /api/stations/search?q=<query>&limit=<n>
 *
 * Searches stations by name, code, or city.
 * Uses the active RailwayDataProvider (mock or Supabase).
 * Returns an array of Station objects.
 */
export async function GET(request: NextRequest) {
  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), 20);

  if (!q || q.trim().length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const provider = getDataProvider();
    const stations = await provider.searchStations({ query: q.trim(), limit });
    return NextResponse.json(stations, {
      status: 200,
      headers: {
        // Cache for 1 hour — station list is static
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[stations/search] Error:', err);
    return NextResponse.json({ error: 'Station search failed' }, { status: 500 });
  }
}
