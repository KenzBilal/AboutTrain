/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAvailabilityProvider } from '@/lib/railway/provider';

// Prevent vercel from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INGESTION_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
  const dbAny = db as any;

  const provider = getAvailabilityProvider();
  if (!provider) {
    return NextResponse.json({ error: 'No Live Availability Provider configured' }, { status: 500 });
  }

  try {
    // 1. Fetch active watchlist items
    const { data: watchlist, error: watchError } = await dbAny
      .from('collection_watchlist')
      .select(`
        id, train_id, from_station, to_station, journey_date, class_code, quota,
        trains!inner(train_number),
        from_st:stations!collection_watchlist_from_station_fkey(station_code),
        to_st:stations!collection_watchlist_to_station_fkey(station_code)
      `)
      .eq('active', true);

    if (watchError) throw watchError;
    if (!watchlist || watchlist.length === 0) {
      return NextResponse.json({ message: 'No active watchlist items' });
    }

    const results = [];
    for (const item of watchlist) {
      // 2. Check for recent successful collection (e.g. within 3 hours)
      // Rate limit protection
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data: recentLogs } = await dbAny
        .from('collection_logs')
        .select('id')
        .eq('watchlist_id', item.id)
        .eq('status', 'SUCCESS')
        .gte('captured_at', threeHoursAgo)
        .limit(1);

      if (recentLogs && recentLogs.length > 0) {
        results.push({ id: item.id, status: 'SKIPPED_RATE_LIMIT' });
        continue;
      }

      // 3. Fetch from provider
      try {
        const fromCode = (item.from_st as { station_code: string }).station_code;
        const toCode = (item.to_st as { station_code: string }).station_code;
        const trainNo = (item.trains as { train_number: string }).train_number;

        const avail = await provider.getAvailability({
          trainId: trainNo,
          fromStation: fromCode,
          toStation: toCode,
          journeyDate: item.journey_date,
          classCode: item.class_code,
          quota: item.quota,
        });

        if (!avail) {
          throw new Error('Provider returned null or failed');
        }

        // 4. Store snapshot (Idempotent for exact same data by replacing/deleting previous snapshot for same journey?
        // Actually, snapshots are time-series, so appending is fine, but if we run multiple times an hour, maybe delete?)
        // The user asked for timestamped snapshots, so appending is expected for historical data.
        
        const snapshotRow = {
          train_id: item.train_id,
          from_station: item.from_station,
          to_station: item.to_station,
          journey_date: item.journey_date,
          class_code: item.class_code,
          quota: item.quota,
          status: avail.status,
          waitlist_number: avail.waitlist_number,
          rac_number: avail.rac_number,
          available_count: avail.available_count,
          fare: avail.fare,
          source: provider.providerName,
        };

        const { error: snapError } = await dbAny.from('availability_snapshots').insert(snapshotRow);
        if (snapError) throw snapError;

        // 5. Log success
        await dbAny.from('collection_logs').insert({
          watchlist_id: item.id,
          status: 'SUCCESS',
        });
        results.push({ id: item.id, status: 'SUCCESS' });

      } catch (err: unknown) {
        // Log failure
        const errorMsg = (err as Error).message || 'Unknown error';
        await dbAny.from('collection_logs').insert({
          watchlist_id: item.id,
          status: 'FAILURE',
          error_message: errorMsg,
        });
        results.push({ id: item.id, status: 'FAILURE', error: errorMsg });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const errorMsg = (error as Error).message || 'Collection failed';
    console.error('[Collect API] Error:', error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
