/**
 * RailwayDataProvider — abstraction interface for all railway data.
 *
 * All pages and components interact with this interface only.
 * The actual implementation (mock, Supabase, external API) is injected at
 * the server layer and never referenced directly by UI components.
 *
 * To replace mock data with real data:
 *   1. Create a new class implementing RailwayDataProvider
 *   2. Update getDataProvider() in lib/railway/provider.ts
 *   3. No UI changes required
 */

import type { Station, TrainResult } from '@/types';

export interface StationSearchOptions {
  query: string;
  limit?: number;
}

export interface TrainSearchOptions {
  fromCode: string;
  toCode: string;
  date: string;      // YYYY-MM-DD
  classCode?: string;
  quota?: string;
}

export interface HistoricalClearanceResult {
  trainId: string;
  classCode: string;
  quota: string;
  /** Total samples observed */
  totalSamples: number;
  /** Samples where WL cleared to CNF */
  clearedSamples: number;
  /** Clearance rate 0–1 */
  clearanceRate: number;
  /** Average WL at chart time for cleared tickets */
  avgClearedWl: number | null;
  /** Source tag for transparency */
  dataSource: string;
}

export interface RailwayDataProvider {
  /** Search stations by name or code */
  searchStations(options: StationSearchOptions): Promise<Station[]>;

  /** Get a single station by code */
  getStation(code: string): Promise<Station | null>;

  /** Search trains connecting two stations on a given date */
  searchTrains(options: TrainSearchOptions): Promise<TrainResult[]>;

  /**
   * Get historical clearance data for a train/class/quota combo.
   * Returns null if no data is available (never fabricate).
   */
  getHistoricalClearance(
    trainId: string,
    classCode: string,
    quota: string
  ): Promise<HistoricalClearanceResult | null>;

  /** Human-readable provider name shown in UI for transparency */
  readonly providerName: string;

  /** Whether this provider uses real data or illustrative mock data */
  readonly isDemo: boolean;
}
