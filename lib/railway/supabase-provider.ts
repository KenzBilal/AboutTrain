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
import { calculatePrediction } from '@/lib/prediction/engine';
import { differenceInDays, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type DbStation = Database['public']['Tables']['stations']['Row'];
type DbTrain = Database['public']['Tables']['trains']['Row'];
type DbTrainStop = Database['public']['Tables']['train_stops']['Row'];
type DbAvailability = Database['public']['Tables']['availability_snapshots']['Row'];
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

    const daysToJourney = date ? Math.max(0, differenceInDays(parseISO(date), new Date())) : 25;

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

    // Fetch availability snapshots for these trains
    let availQuery = db
      .from('availability_snapshots')
      .select('*')
      .in('train_id', trainIds)
      .eq('from_station', from.id)
      .eq('to_station', to.id);

    if (date) availQuery = availQuery.eq('journey_date', date) as unknown as typeof availQuery;
    if (classCode) availQuery = availQuery.eq('class_code', classCode) as unknown as typeof availQuery;

    const { data: availRowsRaw } = await availQuery;
    const availRows = (availRowsRaw ?? []) as DbAvailability[];
    
    if (availRows.length === 0) return [];

    // Fetch train info
    const { data: trainRowsRaw } = await db
      .from('trains')
      .select('*')
      .in('id', trainIds);
    const trainRows = (trainRowsRaw ?? []) as DbTrain[];

    const trainMap = new Map(trainRows.map((t: DbTrain) => [t.id, t]));
    const fromStopMap = new Map(connectingStops.map((s: DbTrainStop) => [s.train_id, s]));

    return availRows.map((avail: DbAvailability) => {
      const dbTrain = trainMap.get(avail.train_id ?? '');
      const train: Train = {
        id: dbTrain?.id ?? avail.train_id ?? '',
        train_number: dbTrain?.train_number ?? '',
        train_name: dbTrain?.train_name ?? '',
        train_type: dbTrain?.train_type ?? '',
        source_station: dbTrain?.source_station ?? '',
        destination_station: dbTrain?.destination_station ?? '',
        runs_on: dbTrain?.runs_on ?? '',
      };

      const fromStop = fromStopMap.get(train.id);
      const toStop = toStopMap.get(train.id);
      const dep = fromStop?.departure_time?.slice(0, 5) ?? '—';
      const arr = toStop?.arrival_time?.slice(0, 5) ?? '—';

      const prediction = calculatePrediction({
        trainId: train.id,
        journeyDate: date ?? avail.journey_date,
        classCode: avail.class_code,
        quota: avail.quota,
        status: avail.status,
        waitlistNumber: avail.waitlist_number ?? undefined,
        racNumber: avail.rac_number ?? undefined,
        daysToJourney,
      });

      return {
        train,
        fromStation: from,
        toStation: to,
        departureTime: dep,
        arrivalTime: arr,
        duration: '—', // TODO: compute from stop times
        availability: {
          id: avail.id,
          train_id: avail.train_id ?? '',
          from_station: avail.from_station ?? '',
          to_station: avail.to_station ?? '',
          journey_date: avail.journey_date,
          class_code: avail.class_code,
          quota: avail.quota,
          status: avail.status as TrainResult['availability']['status'],
          waitlist_number: avail.waitlist_number ?? undefined,
          rac_number: avail.rac_number ?? undefined,
          available_count: avail.available_count ?? undefined,
          fare: avail.fare ?? 0,
          captured_at: avail.captured_at,
        },
        prediction,
      };
    });
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
