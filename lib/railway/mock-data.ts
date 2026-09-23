import type { Station, Train, AvailabilitySnapshot } from '@/types';

/**
 * DEMO DATA — not real railway data.
 * This dataset is used when Supabase is not configured (DEMO MODE).
 * All values are illustrative only.
 *
 * Key for station IDs (simple strings for mock, UUIDs in production):
 *   '1' = PGW (Phagwara Junction)
 *   '2' = BCT (Mumbai Central)
 *   '3' = NDLS (New Delhi)
 *   '4' = LDH (Ludhiana Junction)
 *   '5' = JUC (Jalandhar City)
 *   '6' = ASR (Amritsar Junction)
 *   '7' = CSMT (Chhatrapati Shivaji Maharaj Terminus)
 *   '8' = ADI (Ahmedabad Junction)
 */

export const mockStations: Station[] = [
  { id: '1', station_code: 'PGW', station_name: 'Phagwara Junction', city: 'Phagwara', state: 'Punjab', zone: 'NR' },
  { id: '2', station_code: 'BCT', station_name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', zone: 'WR' },
  { id: '3', station_code: 'NDLS', station_name: 'New Delhi', city: 'New Delhi', state: 'Delhi', zone: 'NR' },
  { id: '4', station_code: 'LDH', station_name: 'Ludhiana Junction', city: 'Ludhiana', state: 'Punjab', zone: 'NR' },
  { id: '5', station_code: 'JUC', station_name: 'Jalandhar City', city: 'Jalandhar', state: 'Punjab', zone: 'NR' },
  { id: '6', station_code: 'ASR', station_name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', zone: 'NR' },
  { id: '7', station_code: 'CSMT', station_name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR' },
  { id: '8', station_code: 'ADI', station_name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR' },
  { id: '9', station_code: 'JP', station_name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', zone: 'NWR' },
  { id: '10', station_code: 'HWH', station_name: 'Howrah Junction', city: 'Howrah', state: 'West Bengal', zone: 'ER' },
  { id: '11', station_code: 'MAS', station_name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR' },
  { id: '12', station_code: 'SC', station_name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', zone: 'SCR' },
  { id: '13', station_code: 'SBC', station_name: 'Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR' },
  { id: '14', station_code: 'PUNE', station_name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', zone: 'CR' },
  { id: '15', station_code: 'CDG', station_name: 'Chandigarh', city: 'Chandigarh', state: 'Chandigarh', zone: 'NR' },
];

export const mockTrains: Train[] = [
  {
    id: 't1',
    train_number: '12926',
    train_name: 'Paschim Express',
    train_type: 'Superfast',
    source_station: 'ASR',
    destination_station: 'BCT',
    runs_on: 'Daily',
  },
  {
    id: 't2',
    train_number: '12904',
    train_name: 'Golden Temple Mail',
    train_type: 'Superfast',
    source_station: 'ASR',
    destination_station: 'BCT',
    runs_on: 'Daily',
  },
  {
    id: 't3',
    train_number: '11058',
    train_name: 'ASR CSMT Express',
    train_type: 'Express',
    source_station: 'ASR',
    destination_station: 'CSMT',
    runs_on: 'Tue, Fri',
  },
];

/**
 * Mock train stop schedule.
 * In production this comes from train_stops table.
 * Format: { trainId → { stationCode → { departure, arrival } } }
 */
export const mockStops: Record<string, Record<string, { departure: string; arrival: string; distanceKm: number }>> = {
  t1: {
    ASR:  { departure: '05:00', arrival: '05:00', distanceKm: 0 },
    JUC:  { departure: '06:40', arrival: '06:35', distanceKm: 75 },
    LDH:  { departure: '07:40', arrival: '07:30', distanceKm: 118 },
    PGW:  { departure: '09:12', arrival: '09:00', distanceKm: 153 },
    NDLS: { departure: '16:15', arrival: '16:00', distanceKm: 513 },
    BCT:  { departure: '09:05', arrival: '09:05', distanceKm: 1733 },
  },
  t2: {
    ASR:  { departure: '16:40', arrival: '16:40', distanceKm: 0 },
    JUC:  { departure: '18:20', arrival: '18:15', distanceKm: 75 },
    LDH:  { departure: '19:20', arrival: '19:10', distanceKm: 118 },
    PGW:  { departure: '21:25', arrival: '21:15', distanceKm: 153 },
    NDLS: { departure: '06:30', arrival: '06:15', distanceKm: 513 },
    BCT:  { departure: '23:55', arrival: '23:55', distanceKm: 1733 },
  },
  t3: {
    ASR:  { departure: '09:15', arrival: '09:15', distanceKm: 0 },
    LDH:  { departure: '11:00', arrival: '10:50', distanceKm: 118 },
    PGW:  { departure: '11:30', arrival: '11:20', distanceKm: 153 },
    CSMT: { departure: '16:00', arrival: '16:00', distanceKm: 1740 },
  },
};

/**
 * Compute duration string from departure at 'from' to arrival at 'to'.
 * Handles overnight (next day).
 */
export function computeDuration(dep: string, arr: string): string {
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  let totalMin = (ah * 60 + am) - (dh * 60 + dm);
  if (totalMin < 0) totalMin += 24 * 60; // next day
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/**
 * Check if arrival is next day relative to departure.
 * Returns '+1' if next day, '' if same day.
 */
export function arrivalDaySuffix(dep: string, arr: string): string {
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  return (ah * 60 + am) < (dh * 60 + dm) ? ' +1' : '';
}

export const mockAvailability: AvailabilitySnapshot[] = [
  {
    id: 'a1',
    train_id: 't1',
    from_station: '1',
    to_station: '2',
    journey_date: '2026-10-18',
    class_code: '3A',
    quota: 'GN',
    status: 'WL',
    waitlist_number: 18,
    fare: 1850,
    captured_at: new Date().toISOString(),
    source: 'Mock Data',
  },
  {
    id: 'a2',
    train_id: 't1',
    from_station: '1',
    to_station: '2',
    journey_date: '2026-10-18',
    class_code: 'SL',
    quota: 'GN',
    status: 'WL',
    waitlist_number: 45,
    fare: 720,
    captured_at: new Date().toISOString(),
    source: 'Mock Data',
  },
  {
    id: 'a3',
    train_id: 't2',
    from_station: '1',
    to_station: '2',
    journey_date: '2026-10-18',
    class_code: '3A',
    quota: 'GN',
    status: 'RAC',
    rac_number: 12,
    fare: 1920,
    captured_at: new Date().toISOString(),
    source: 'Mock Data',
  },
  {
    id: 'a4',
    train_id: 't2',
    from_station: '1',
    to_station: '2',
    journey_date: '2026-10-18',
    class_code: '2A',
    quota: 'GN',
    status: 'AVAILABLE',
    available_count: 6,
    fare: 2570,
    captured_at: new Date().toISOString(),
    source: 'Mock Data',
  },
  {
    id: 'a5',
    train_id: 't3',
    from_station: '1',
    to_station: '7',
    journey_date: '2026-10-18',
    class_code: '3A',
    quota: 'GN',
    status: 'CNF',
    available_count: 12,
    fare: 2050,
    captured_at: new Date().toISOString(),
    source: 'Mock Data',
  },
];

/**
 * Mock historical clearance data.
 * In production this is computed from historical_outcomes table.
 * keyed by `${trainId}:${classCode}:${quota}`
 */
export const mockHistoricalClearance: Record<string, {
  totalSamples: number;
  clearedSamples: number;
  avgClearedWl: number;
}> = {
  't1:3A:GN': { totalSamples: 42, clearedSamples: 29, avgClearedWl: 22 },
  't1:SL:GN': { totalSamples: 68, clearedSamples: 38, avgClearedWl: 40 },
  't2:3A:GN': { totalSamples: 35, clearedSamples: 32, avgClearedWl: 18 },
  't2:2A:GN': { totalSamples: 18, clearedSamples: 14, avgClearedWl: 10 },
  't3:3A:GN': { totalSamples: 22, clearedSamples: 21, avgClearedWl: 15 },
};
