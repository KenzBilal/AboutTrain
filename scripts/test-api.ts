import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.WebSocket = WebSocket as any;
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { SupabaseRailwayDataProvider } from '../lib/railway/supabase-provider';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function test() {
  const provider = new SupabaseRailwayDataProvider();
  
  console.log('--- Testing searchStations ---');
  const stations = await provider.searchStations({ query: 'ndls', limit: 3 });
  console.log('Stations for "ndls":', stations);

  console.log('\n--- Testing searchTrains (NDLS to HWH) ---');
  // NDLS (New Delhi) to HWH (Howrah)
  const trains = await provider.searchTrains({ 
    fromCode: 'NDLS', 
    toCode: 'HWH',
    date: '2026-10-01'
  });
  console.log(`Found ${trains.length} trains from NDLS to HWH`);
  if (trains.length > 0) {
    console.log('Example train:', {
      train_number: trains[0].train.train_number,
      name: trains[0].train.train_name,
      dep: trains[0].departureTime,
      arr: trains[0].arrivalTime,
      duration: trains[0].duration,
      runs_on: trains[0].train.runs_on
    });
  }

  console.log('\n--- Testing no-result route (NDLS to NDLS) ---');
  const noResult = await provider.searchTrains({
    fromCode: 'NDLS',
    toCode: 'NDLS',
    date: '2026-10-01'
  });
  console.log(`Found ${noResult.length} trains from NDLS to NDLS`);
}

test().catch(console.error);
