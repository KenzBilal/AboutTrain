import type { AvailabilitySnapshot } from '@/types';

export interface AvailabilityRequestOptions {
  trainId: string;
  fromStation: string;
  toStation: string;
  journeyDate: string; // YYYY-MM-DD
  classCode: string;
  quota: string;
}

export interface AvailabilityProvider {
  /** Fetch live availability for a specific journey */
  getAvailability(options: AvailabilityRequestOptions): Promise<AvailabilitySnapshot | null>;

  /** Human-readable provider name shown in UI for transparency */
  readonly providerName: string;

  /** Whether this provider uses real live data or mock data */
  readonly isDemo: boolean;
}
