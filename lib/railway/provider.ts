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
}
