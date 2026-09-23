/**
 * SupabaseRailwayDataProvider
 *
 * Implements RailwayDataProvider using the Supabase database.
 * Active when NEXT_PUBLIC_SUPABASE_URL is set in environment.
 *
 * This implementation reads from the live Supabase database.
 * Requires proper RLS policies and seeded data.
 */

import type { RailwayDataProvider, StationSearchOptions, TrainSearchOptions, HistoricalClearanceResult } from './provider.interface';
import type { Station, Train, TrainResult } from '@/types';
import { createAdminClient } from '@/lib/supabase/server';

import { differenceInDays, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type DbStation = Database['public']['Tables']['stations']['Row'];
type DbTrain = Database['public']['Tables']['trains']['Row'];
type DbTrainStop = Database['public']['Tables']['train_stops']['Row'];

type DbHistoricalOutcome = Database['public']['Tables']['historical_outcomes']['Row'];

function mapStation(row: DbStation): Station {
  return {
    id: row.id,
    station_code: row.station_code,
    station_name: row.station_name,
    city: row.city ?? '',
    state: row.state ?? '',
    zone: row.zone ?? '',
  };
}

export class SupabaseRailwayDataProvider implements RailwayDataProvider {
  readonly providerName = 'Supabase Database';
  readonly isDemo = false;

  async searchStations({ query, limit = 8 }: StationSearchOptions): Promise<Station[]> {
    const db = createAdminClient();
    if (!db) return [];

    const q = query.trim();
    if (q.length < 1) return [];

    const { data, error } = await db
      .from('stations')
      .select('*')
      .or(`station_code.ilike.${q}%,station_name.ilike.%${q}%,city.ilike.%${q}%`)
      .eq('is_active', true)
      .limit(limit)
      .order('station_name');

    if (error || !data) return [];
    return data.map(mapStation);
  }

  async getStation(code: string): Promise<Station | null> {
    const db = createAdminClient();
    if (!db) return null;

    const { data, error } = await db
      .from('stations')
      .select('*')
      .eq('station_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return mapStation(data);
  }

  async searchTrains({ fromCode, toCode, date, classCode }: TrainSearchOptions): Promise<TrainResult[]> {
    const db = createAdminClient();
    if (!db) return [];

    const from = await this.getStation(fromCode);
    const to = await this.getStation(toCode);
    if (!from || !to) return [];

    // Unused when live availability is disabled: date, classCode, daysToJourney

    // Find trains that stop at both from and to stations (from before to)
    const { data: fromStopsRaw } = await db
      .from('train_stops')
      .select('*')
      .eq('station_id', from.id);
    const fromStops = (fromStopsRaw ?? []) as DbTrainStop[];

    const { data: toStopsRaw } = await db
      .from('train_stops')
      .select('*')
      .eq('station_id', to.id);
    const toStops = (toStopsRaw ?? []) as DbTrainStop[];

    if (!fromStops.length || !toStops.length) return [];

    // Find train_ids that stop at from before to
    const toStopMap = new Map(toStops.map((s: DbTrainStop) => [s.train_id, s]));
    const connectingStops = fromStops.filter((fs: DbTrainStop) => {
      const ts = toStopMap.get(fs.train_id);
      return ts && ts.stop_sequence > fs.stop_sequence;
    });

    const trainIds = connectingStops.map((s: DbTrainStop) => s.train_id);
    if (trainIds.length === 0) return [];

    // Fetch train info
    const { data: trainRowsRaw } = await db
      .from('trains')
      .select('*')
      .in('id', trainIds)
      .eq('is_active', true);
    
    const trainRows = (trainRowsRaw ?? []) as DbTrain[];

    const trainMap = new Map(trainRows.map((t: DbTrain) => [t.id, t]));
    const fromStopMap = new Map(connectingStops.map((s: DbTrainStop) => [s.train_id, s]));

    // Get the requested day index (0 = Monday, 6 = Sunday)
    let requestedDayIndex = -1;
    if (date) {
      const parsedDate = parseISO(date);
      requestedDayIndex = parsedDate.getDay() === 0 ? 6 : parsedDate.getDay() - 1;
    }

    const results: TrainResult[] = [];

    for (const trainId of trainIds) {
      const dbTrain = trainMap.get(trainId);
      if (!dbTrain) continue;

      if (requestedDayIndex !== -1 && dbTrain.runs_on) {
        if (dbTrain.runs_on[requestedDayIndex] === 'N') {
          continue; // Train does not run on this day
        }
      }

      const train: Train = {
        id: dbTrain.id,
        train_number: dbTrain.train_number,
        train_name: dbTrain.train_name,
        train_type: dbTrain.train_type ?? '',
        source_station: dbTrain.source_station ?? '',
        destination_station: dbTrain.destination_station ?? '',
        runs_on: dbTrain.runs_on ?? '',
      };

      const fromStop = fromStopMap.get(train.id);
      const toStop = toStopMap.get(train.id);
      
      const dep = fromStop?.departure_time?.slice(0, 5) ?? '—';
      const arr = toStop?.arrival_time?.slice(0, 5) ?? '—';

      // Calculate duration
      let durationStr = '—';
      if (fromStop?.departure_time && toStop?.arrival_time) {
        const [dh, dm] = fromStop.departure_time.split(':').map(Number);
        const [ah, am] = toStop.arrival_time.split(':').map(Number);
        
        let minutesDiff = (ah * 60 + am) - (dh * 60 + dm);
        if (minutesDiff < 0) {
          // Crosses midnight
          minutesDiff += 24 * 60;
        }
        
        const h = Math.floor(minutesDiff / 60);
        const m = minutesDiff % 60;
        durationStr = `${h}h ${m}m`;
      }

      results.push({
        train,
        fromStation: from,
        toStation: to,
        departureTime: dep,
        arrivalTime: arr,
        duration: durationStr,
      });
    }

    return results;
  }

  async getHistoricalClearance(
    trainId: string,
    classCode: string,
    quota: string
  ): Promise<HistoricalClearanceResult | null> {
    const db = createAdminClient();
    if (!db) return null;

    const { data: rawData, error } = await db
      .from('historical_outcomes')
      .select('*')
      .eq('train_id', trainId)
      .eq('class_code', classCode)
      .eq('quota', quota);

    if (error || !rawData || rawData.length === 0) return null;

    const data = rawData as DbHistoricalOutcome[];
    const cleared = data.filter((r: DbHistoricalOutcome) => r.final_status === 'CNF');
    const clearedWls = cleared.map((r: DbHistoricalOutcome) => r.initial_waitlist).filter(Boolean) as number[];
    const avgClearedWl = clearedWls.length > 0
      ? Math.round(clearedWls.reduce((a, b) => a + b, 0) / clearedWls.length)
      : null;

    return {
      trainId,
      classCode,
      quota,
      totalSamples: data.length,
      clearedSamples: cleared.length,
      clearanceRate: cleared.length / data.length,
      avgClearedWl,
      dataSource: 'Supabase (historical_outcomes table)',
    };
  }
}
