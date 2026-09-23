/**
 * MockRailwayDataProvider
 *
 * Implements RailwayDataProvider using in-memory demo data.
 * All results are labelled as demo data in the UI.
 * This is the active provider when Supabase is not configured.
 *
 * Replace this with SupabaseRailwayDataProvider when real data is available.
 */

import type { RailwayDataProvider, StationSearchOptions, TrainSearchOptions, HistoricalClearanceResult } from './provider.interface';
import type { Station, TrainResult } from '@/types';
import {
  mockStations,
  mockTrains,
  mockAvailability,
  mockStops,
  mockHistoricalClearance,
  computeDuration,
  arrivalDaySuffix,
} from './mock-data';
import { calculatePrediction } from '@/lib/prediction/engine';
import { differenceInDays, parseISO } from 'date-fns';

export class MockRailwayDataProvider implements RailwayDataProvider {
  readonly providerName = 'Demo Data (Mock)';
  readonly isDemo = true;

  async searchStations({ query, limit = 8 }: StationSearchOptions): Promise<Station[]> {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase();
    return mockStations
      .filter(
        s =>
          s.station_code.toLowerCase().includes(q) ||
          s.station_name.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q)
      )
      .slice(0, limit);
  }

  async getStation(code: string): Promise<Station | null> {
    return mockStations.find(s => s.station_code === code.toUpperCase()) ?? null;
  }

  async searchTrains({ fromCode, toCode, date, classCode, quota = 'GN' }: TrainSearchOptions): Promise<TrainResult[]> {
    const from = await this.getStation(fromCode);
    const to = await this.getStation(toCode);
    if (!from || !to) return [];

    const daysToJourney = date ? Math.max(0, differenceInDays(parseISO(date), new Date())) : 25;
    const journeyDate = date || mockAvailability[0].journey_date;

    // Filter availability: matching from/to station IDs, optionally class
    let avails = mockAvailability.filter(a => {
      const matchFrom = a.from_station === from.id;
      const matchTo = a.to_station === to.id || (to.station_code === 'CSMT' && a.to_station === '7');
      const matchClass = classCode ? a.class_code === classCode : true;
      return matchFrom && matchTo && matchClass;
    });

    // If nothing matches (e.g. unknown route in demo), fall back to all with from=1 to=2
    if (avails.length === 0) {
      avails = classCode
        ? mockAvailability.filter(a => a.class_code === classCode)
        : mockAvailability;
    }

    return avails.map(avail => {
      const train = mockTrains.find(t => t.id === avail.train_id)!;
      const stops = mockStops[train.id] ?? {};
      const fromStop = stops[from.station_code] ?? stops['PGW']; // fallback
      const toStop = stops[to.station_code] ?? stops['BCT']; // fallback

      const dep = fromStop?.departure ?? '00:00';
      const arr = toStop?.arrival ?? '00:00';
      const duration = (fromStop && toStop) ? computeDuration(dep, arr) : '—';
      const daySuffix = (fromStop && toStop) ? arrivalDaySuffix(dep, arr) : '';

      const prediction = calculatePrediction({
        trainId: train.id,
        journeyDate,
        classCode: avail.class_code,
        quota: avail.quota,
        status: avail.status,
        waitlistNumber: avail.waitlist_number,
        racNumber: avail.rac_number,
        daysToJourney,
        historicalClearanceRate: mockHistoricalClearance[`${train.id}:${avail.class_code}:${avail.quota}`]
          ? mockHistoricalClearance[`${train.id}:${avail.class_code}:${avail.quota}`].clearedSamples /
            mockHistoricalClearance[`${train.id}:${avail.class_code}:${avail.quota}`].totalSamples
          : undefined,
        historicalSampleCount: mockHistoricalClearance[`${train.id}:${avail.class_code}:${avail.quota}`]?.totalSamples,
      });

      return {
        train,
        fromStation: from,
        toStation: to,
        departureTime: dep,
        arrivalTime: arr + daySuffix,
        duration,
        availability: { ...avail, journey_date: journeyDate, quota },
        prediction,
      };
    });
  }

  async getHistoricalClearance(
    trainId: string,
    classCode: string,
    quota: string
  ): Promise<HistoricalClearanceResult | null> {
    const key = `${trainId}:${classCode}:${quota}`;
    const data = mockHistoricalClearance[key];
    if (!data) return null;
    return {
      trainId,
      classCode,
      quota,
      totalSamples: data.totalSamples,
      clearedSamples: data.clearedSamples,
      clearanceRate: data.clearedSamples / data.totalSamples,
      avgClearedWl: data.avgClearedWl,
      dataSource: 'Demo mock data — not real historical records',
    };
  }
}
