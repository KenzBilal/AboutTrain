import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/ingest
 * 
 * Secure ingestion endpoint for external railway data workers.
 * Expects an Authorization header with a secret token.
 * Uses the Supabase Service Role key to bypass RLS for data insertion.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INGESTION_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    // Based on the type, route to the correct table
    switch (type) {
      case 'availability_snapshots':
        const { error: availError } = await db.from('availability_snapshots').insert(data);
        if (availError) throw availError;
        break;
      
      case 'historical_outcomes':
        const { error: histError } = await db.from('historical_outcomes').insert(data);
        if (histError) throw histError;
        break;
        
      case 'stations':
        // Upsert stations
        const { error: stationError } = await db.from('stations').upsert(data, { onConflict: 'station_code' });
        if (stationError) throw stationError;
        break;

      case 'trains':
        // Upsert trains
        const { error: trainError } = await db.from('trains').upsert(data, { onConflict: 'train_number' });
        if (trainError) throw trainError;
        break;

      default:
        return NextResponse.json({ error: `Unsupported ingestion type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, ingested_records: data.length });
  } catch (error: any) {
    console.error('[Ingest API] Error:', error);
    return NextResponse.json({ error: error.message || 'Ingestion failed' }, { status: 500 });
  }
}
