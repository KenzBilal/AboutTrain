import type { AvailabilityProvider, AvailabilityRequestOptions } from './availability.interface';
import type { AvailabilitySnapshot } from '@/types';

export class RailRadarAvailabilityProvider implements AvailabilityProvider {
  readonly providerName = 'RailRadar (third-party)';
  readonly isDemo = false;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getAvailability(options: AvailabilityRequestOptions): Promise<AvailabilitySnapshot | null> {
    const { trainId, fromStation, toStation, journeyDate, classCode, quota } = options;

    try {
      // 4s timeout — Vercel Hobby functions have a 10s limit and we run many concurrent requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      let res: Response;
      try {
        res = await fetch(
          `https://api.railradar.in/v1/trains/${trainId}/seats?from=${fromStation}&to=${toStation}&class=${classCode}&quota=${quota}&date=${journeyDate}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json'
            },
            cache: 'no-store',
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        console.error(`[RailRadar] API Error ${res.status}: ${res.statusText}`);
        return null; // Graceful fallback
      }

      const data = await res.json();
      
      if (!data || !data.success) {
        console.error('[RailRadar] Unsuccessful response', data?.error);
        return null;
      }

      // Handle both array of items or nested data array
      const items = Array.isArray(data.data) ? data.data : (
        Array.isArray(data.data?.calendar) ? data.data.calendar : (
          Array.isArray(data.data?.availability) ? data.data.availability : []
        )
      );
      
      // Find exact date match or use first item if only one returned
      let match = items.find((item: Record<string, unknown>) => item.date === journeyDate || item.journeyDate === journeyDate || item.journey_date === journeyDate);
      
      if (!match && items.length > 0) {
        match = items[0]; // Fallback if format is weird but it returned a single result
      }

      if (!match || !match.status) {
        return null;
      }

      const parsedStatus = this.parseStatus(match.status);
      
      if (parsedStatus.status === 'UNKNOWN') {
        return null;
      }

      let fare = match.fare || match.totalFare || match.ticketFare || 0;
      if (typeof fare === 'string') {
        fare = parseInt(fare.replace(/[^0-9]/g, ''), 10);
      }

      return {
        id: `rr-${trainId}-${journeyDate}-${classCode}-${quota}-${Date.now()}`,
        train_id: trainId,
        from_station: fromStation,
        to_station: toStation,
        journey_date: journeyDate,
        class_code: classCode,
        quota,
        status: parsedStatus.status,
        available_count: parsedStatus.available_count,
        waitlist_number: parsedStatus.waitlist_number,
        rac_number: parsedStatus.rac_number,
        fare: fare || 0,
        captured_at: new Date().toISOString(),
        source: 'RailRadar API',
      };
    } catch (err) {
      console.error('[RailRadar] Network/Parse Error:', err);
      return null;
    }
  }

  parseStatus(rawStatus: string): { status: AvailabilitySnapshot['status'] | 'UNKNOWN'; available_count?: number; waitlist_number?: number; rac_number?: number } {
    const statusUpper = rawStatus.toUpperCase().trim();

    // REGRET
    if (statusUpper.includes('REGRET')) {
      return { status: 'REGRET' };
    }

    // AVAILABLE-0042 or CURR_AVBL-0042
    if (statusUpper.startsWith('AVAILABLE') || statusUpper.includes('AVBL')) {
      const match = statusUpper.match(/\d+/);
      return {
        status: 'AVAILABLE',
        available_count: match ? parseInt(match[0], 10) : undefined,
      };
    }

    // RAC 12 or RAC12/RAC12
    if (statusUpper.startsWith('RAC')) {
      // Get the last number in case of "RAC15/RAC12"
      const numbers = statusUpper.match(/\d+/g);
      const racNo = numbers && numbers.length > 0 ? parseInt(numbers[numbers.length - 1], 10) : undefined;
      return {
        status: 'RAC',
        rac_number: racNo,
      };
    }

    // GNWL24/WL11 or PQWL10/WL5 or RLWL12/WL3
    if (statusUpper.includes('WL')) {
      const numbers = statusUpper.match(/\d+/g);
      const wlNo = numbers && numbers.length > 0 ? parseInt(numbers[numbers.length - 1], 10) : undefined;
      return {
        status: 'WL',
        waitlist_number: wlNo,
      };
    }

    // CNF / Confirmed
    if (statusUpper.includes('CNF') || statusUpper.includes('CONFIRM')) {
      return { status: 'CNF' };
    }

    return { status: 'UNKNOWN' };
  }
}
