import type { AvailabilityProvider, AvailabilityRequestOptions } from './availability.interface';
import type { AvailabilitySnapshot } from '@/types';

export class MockAvailabilityProvider implements AvailabilityProvider {
  readonly providerName = 'Mock Live Provider';
  readonly isDemo = true;

  async getAvailability(options: AvailabilityRequestOptions): Promise<AvailabilitySnapshot | null> {
    const { trainId, fromStation, toStation, journeyDate, classCode, quota } = options;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Seeded random based on trainId and date
    const seedStr = `${trainId}-${journeyDate}-${classCode}-${quota}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed << 5) - seed + seedStr.charCodeAt(i);
      seed |= 0;
    }
    const rand = Math.abs(seed) % 100;

    let status: AvailabilitySnapshot['status'] = 'AVAILABLE';
    let available_count: number | undefined;
    let waitlist_number: number | undefined;
    let rac_number: number | undefined;

    if (rand < 30) {
      status = 'AVAILABLE';
      available_count = (rand % 50) + 1;
    } else if (rand < 50) {
      status = 'RAC';
      rac_number = (rand % 20) + 1;
    } else if (rand < 95) {
      status = 'WL';
      waitlist_number = (rand % 100) + 1;
    } else {
      status = 'REGRET';
    }

    return {
      id: `mock-avail-${seedStr}`,
      train_id: trainId,
      from_station: fromStation,
      to_station: toStation,
      journey_date: journeyDate,
      class_code: classCode,
      quota,
      status,
      available_count,
      waitlist_number,
      rac_number,
      fare: 1200 + (rand * 10),
      captured_at: new Date().toISOString(),
      source: 'Mock Provider',
    };
  }
}
