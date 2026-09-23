import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.WebSocket = WebSocket as any;
import * as dotenv from 'dotenv';
import { resolve } from 'path';


// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

const STATIONS_URL = 'https://raw.githubusercontent.com/prasenjit-27/Indian-Railway-Data/main/stations.json';
const TRAINS_URL = 'https://raw.githubusercontent.com/prasenjit-27/Indian-Railway-Data/main/trains.json';

// Batch upsert function to avoid Supabase 1000-row limit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchUpsert(table: string, data: any[], conflictTarget: string | null = null, batchSize = 500) {
  const results = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.from(table).upsert(batch, conflictTarget ? { onConflict: conflictTarget } : undefined);
    
    // We need to select id and conflict target for mapping
    if (conflictTarget) {
      query = query.select(`id, ${conflictTarget}`);
    } else {
      // For train_stops, we don't need to return data to save bandwidth
      query = query.select('id');
    }

    const { data: result, error } = await query;
    
    if (error) {
      throw error;
    }
    if (result) {
      results.push(...result);
    }
    
    process.stdout.write(`\rInserted ${Math.min(i + batchSize, data.length)} / ${data.length} into ${table}`);
  }
  console.log(); // newline
  return results;
}

async function run() {
  console.log('--- Starting ETL Process ---');

  // 1. Fetch Data
  console.log('Fetching stations from GitHub...');
  const stationsRes = await fetch(STATIONS_URL);
  const rawStations = await stationsRes.json();
  
  console.log(`Fetched ${rawStations.length} stations.`);

  console.log('Fetching trains from GitHub...');
  const trainsRes = await fetch(TRAINS_URL);
  const rawTrains = await trainsRes.json();
  
  console.log(`Fetched ${rawTrains.length} trains.`);

  // 2. Process & Upsert Stations
  console.log('Normalizing and upserting stations...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stationPayload = rawStations.map((s: any) => ({
    station_code: s.code,
    station_name: s.name,
    city: s.address || s.state,
    state: s.state,
    zone: s.zone,
    latitude: s.coordinates?.latitude || null,
    longitude: s.coordinates?.longitude || null,
    is_active: true
  }));

  const insertedStations = await batchUpsert('stations', stationPayload, 'station_code');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stationMap = new Map(insertedStations.map((s: any) => [s.station_code, s.id]));

  // 3. Process & Upsert Trains
  console.log('Normalizing and upserting trains...');
  const trainPayload = [];
  
  for (const t of rawTrains) {
    // Generate runs_on string (e.g., M, T, W, T, F, S, S -> YYYYYYY)
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    let runsOn = '';
    for (const d of days) {
      runsOn += t.runningDays?.[d] ? 'Y' : 'N';
    }

    // Ignore trains with invalid source/destination stations that aren't in our station dataset
    const sourceId = stationMap.get(t.source?.code);
    const destId = stationMap.get(t.destination?.code);

    if (!sourceId || !destId) {
      // Skip invalid trains, some historical datasets have mismatches
      continue;
    }

    trainPayload.push({
      train_number: t.trainNumber,
      train_name: t.trainName,
      train_type: t.type,
      source_station: sourceId,
      destination_station: destId,
      runs_on: runsOn,
      is_active: true
    });
  }

  const insertedTrains = await batchUpsert('trains', trainPayload, 'train_number');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainMap = new Map(insertedTrains.map((t: any) => [t.train_number, t.id]));

  // 4. Process & Upsert Train Stops
  console.log('Normalizing train stops...');
  const stopsPayload = [];
  let invalidStops = 0;

  for (const t of rawTrains) {
    const trainId = trainMap.get(t.trainNumber);
    if (!trainId) continue;

    const route = t.completeOrderedRoute || [];
    for (const stop of route) {
      const stationId = stationMap.get(stop.stationCode);
      if (!stationId) {
        invalidStops++;
        continue;
      }

      // Format time strings (e.g. "10:40:00" is fine, but some might be empty or invalid)
      const parseTime = (timeStr: string | null) => {
        if (!timeStr || timeStr === 'None') return null;
        // ensure it's HH:MM:SS format for postgres TIME
        return timeStr;
      };

      stopsPayload.push({
        train_id: trainId,
        station_id: stationId,
        stop_sequence: stop.sequence,
        arrival_time: parseTime(stop.arrivalTime),
        departure_time: parseTime(stop.departureTime),
        distance_km: stop.distance || 0,
        halt_minutes: stop.haltMinutes || 0
      });
    }
  }

  console.log(`Prepared ${stopsPayload.length} train stops (skipped ${invalidStops} missing station refs).`);
  
  // Idempotency for Train Stops:
  // Instead of upserting (we have no unique ID for a stop other than the combo), 
  // we will clear the table entirely and re-insert.
  console.log('Clearing existing train_stops for fresh seed...');
  await db.from('train_stops').delete().neq('stop_sequence', -1); // deletes all rows

  console.log('Inserting train stops...');
  await batchUpsert('train_stops', stopsPayload, null, 1000);

  // 5. Update data_sources audit table
  await db.from('data_sources').insert({
    name: 'prasenjit-27/Indian-Railway-Data',
    type: 'Reference Data (Stations, Trains, Stops)',
    license: 'Open Source',
    status: 'ACTIVE',
    last_sync: new Date().toISOString()
  });

  console.log('--- ETL Process Complete ---');
}

run().catch(console.error);
