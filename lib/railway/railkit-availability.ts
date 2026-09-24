import { configure, getAvailability } from 'railkit';
import { format, parseISO } from 'date-fns';
import type { AvailabilityProvider, AvailabilityRequestOptions } from './availability.interface';
import type { AvailabilitySnapshot } from '@/types';

export class RailKitAvailabilityProvider implements AvailabilityProvider {
  readonly providerName = 'RailKit API';
  readonly isDemo = false;

  constructor(apiKey: string) {
    configure(apiKey);
  }

  async getAvailability(opts: AvailabilityRequestOptions): Promise<AvailabilitySnapshot | null> {
    const dateStr = format(parseISO(opts.journeyDate), 'dd-MM-yyyy');

    try {
      const result = await getAvailability(
        opts.trainId,
        opts.fromStation,
        opts.toStation,
        dateStr,
        opts.classCode,
        opts.quota
      );

      if (!result.success || !result.data || !result.data.availability || result.data.availability.length === 0) {
        return null;
      }

      const availInfo = result.data.availability[0]; // get the first available date matched
      const fare = result.data.fare;

      return {
        id: `rk-${opts.trainId}-${opts.journeyDate}-${opts.classCode}-${opts.quota}-${Date.now()}`,
        train_id: opts.trainId,
        from_station: opts.fromStation,
        to_station: opts.toStation,
        journey_date: opts.journeyDate,
        class_code: opts.classCode,
        quota: opts.quota,
        status: this.normalizeStatus(availInfo.availabilityText),
        waitlist_number: this.extractWaitlistNumber(availInfo.availabilityText),
        rac_number: this.extractRacNumber(availInfo.availabilityText),
        fare: fare?.totalFare || 0,
        source: this.providerName,
        captured_at: new Date().toISOString(),
      };
    } catch (e) {
      console.error('[RailKit] API error:', e);
      return null;
    }
  }

  private extractWaitlistNumber(status: string): number | undefined {
    if (status.includes('WL')) {
      const match = status.match(/WL\s*(\d+)/i) || status.match(/W\/L\s*(\d+)/i);
      if (match) return parseInt(match[1], 10);
    }
    return undefined;
  }

  private extractRacNumber(status: string): number | undefined {
    if (status.includes('RAC')) {
      const match = status.match(/RAC\s*(\d+)/i);
      if (match) return parseInt(match[1], 10);
    }
    return undefined;
  }

  private normalizeStatus(status: string): 'CNF' | 'RAC' | 'WL' | 'AVAILABLE' | 'REGRET' {
    const s = status.toUpperCase();
    if (s.includes('REGRET')) return 'REGRET';
    if (s.includes('AVAILABLE') || s.includes('AVL')) return 'AVAILABLE';
    if (s.includes('RAC')) return 'RAC';
    if (s.includes('WL') || s.includes('WAITLIST')) return 'WL';
    if (s.includes('CNF')) return 'CNF';
    return 'WL'; // Default fallback
  }
}
