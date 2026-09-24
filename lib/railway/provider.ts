/**
 * Provider factory — returns the correct RailwayDataProvider for the current environment.
 *
 * Rules:
 *  - Demo mode (no env vars): MockRailwayDataProvider
 *  - Production (env vars set): SupabaseRailwayDataProvider
 *
 * All server components and route handlers call getDataProvider() and
 * receive the active provider without knowing which implementation is used.
 *
 * To switch providers, change this factory. No UI code changes required.
 */

import type { RailwayDataProvider } from './provider.interface';
import { isDemoMode } from '@/lib/env';
import { MockRailwayDataProvider } from './mock-provider';
import { SupabaseRailwayDataProvider } from './supabase-provider';
import type { AvailabilityProvider } from './availability.interface';
import { MockAvailabilityProvider } from './mock-availability';
import { RailRadarAvailabilityProvider } from './railradar-availability';
import { RailKitAvailabilityProvider } from './railkit-availability';

let _provider: RailwayDataProvider | null = null;

export function getDataProvider(): RailwayDataProvider {
  if (_provider) return _provider;

  if (isDemoMode()) {
    _provider = new MockRailwayDataProvider();
  } else {
    _provider = new SupabaseRailwayDataProvider();
  }

  return _provider!;
}

/** Reset provider (useful in tests) */
export function resetDataProvider() {
  _provider = null;
  _availProvider = null;
}

let _availProvider: AvailabilityProvider | null = null;

export function getAvailabilityProvider(): AvailabilityProvider | null {
  if (_availProvider) return _availProvider;

  if (isDemoMode()) {
    _availProvider = new MockAvailabilityProvider();
  } else if (process.env.RAILKIT_API_KEY) {
    _availProvider = new RailKitAvailabilityProvider(process.env.RAILKIT_API_KEY);
  } else if (process.env.RAILRADAR_API_KEY) {
    _availProvider = new RailRadarAvailabilityProvider(process.env.RAILRADAR_API_KEY);
  } else {
    // No legitimate live API credentials configured
    // Wait for legitimate API implementation
    _availProvider = null; 
  }

  return _availProvider;
}
