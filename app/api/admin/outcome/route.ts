/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

  try {
    // 1. Fetch expired active watchlist items (journey date has passed)
    const today = new Date().toISOString().split('T')[0];
    const { data: expiredList, error } = await dbAny
      .from('collection_watchlist')
      .select('*')
      .eq('active', true)
      .lt('journey_date', today);

    if (error) throw error;
    if (!expiredList || expiredList.length === 0) {
      return NextResponse.json({ message: 'No expired journeys to process' });
    }

    const results = [];
    for (const item of expiredList) {
      // 2. Fetch the earliest snapshot to record the initial waitlist
      const { data: initialSnapshots } = await dbAny
        .from('availability_snapshots')
        .select('*')
        .eq('train_id', item.train_id)
        .eq('from_station', item.from_station)
        .eq('to_station', item.to_station)
        .eq('journey_date', item.journey_date)
        .eq('class_code', item.class_code)
        .eq('quota', item.quota)
        .order('captured_at', { ascending: true })
        .limit(1);

      if (!initialSnapshots || initialSnapshots.length === 0) {
        // No data collected at all, just deactivate
        await dbAny.from('collection_watchlist').update({ active: false }).eq('id', item.id);
        results.push({ id: item.id, status: 'DEACTIVATED_NO_DATA' });
        continue;
      }


      // 3. Obtain final chart outcome. 
      // Currently, we do NOT have a legitimate API endpoint for historical charting outcomes.
      // We MUST NOT fabricate this or assume the last snapshot before the date is the final outcome.
      // Therefore, we gracefully skip creating a historical outcome for now, but deactivate the watchlist item.
      
      const hasLegitimateOutcomeSource = false;

      if (!hasLegitimateOutcomeSource) {
        await dbAny.from('collection_watchlist').update({ active: false }).eq('id', item.id);
        results.push({ id: item.id, status: 'DEACTIVATED_PENDING_SOURCE' });
        continue;
      }

      // Future implementation when a legitimate source is added:
      // const finalOutcome = await fetchLegitimateOutcome(...);
      // await db.from('historical_outcomes').insert({ ... });
      // await db.from('collection_watchlist').update({ active: false }).eq('id', item.id);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = (err as Error).message || 'Outcome processing failed';
    console.error('[Outcome API] Error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
