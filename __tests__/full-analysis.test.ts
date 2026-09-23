import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).WebSocket = WebSocket;
import TrainDetailsPage from '../app/trains/[id]/page';
import { resetDataProvider } from '../lib/railway/provider';

// Helper to search React node tree for text
function containsText(obj: unknown, text: string): boolean {
  if (typeof obj === 'string') return obj.includes(text);
  if (!obj || typeof obj !== 'object') return false;
  
  const seen = new Set();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queue: any[] = [obj];
  
  while (queue.length > 0) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    
    if (typeof current === 'string') {
      if ((current as string).includes(text)) return true;
    } else if (Array.isArray(current)) {
      queue.push(...current);
    } else if (typeof current === 'object' && current !== null) {
      for (const key of Object.keys(current)) {
        queue.push((current as Record<string, unknown>)[key]);
      }
    }
  }
  return false;
}

describe('Full Analysis Route (/trains/[id])', () => {
  const trainId = '12951';

  test('Missing date returns Missing journey details', async () => {
    const params = Promise.resolve({ id: trainId });
    const searchParams = Promise.resolve({ from: 'NDLS', to: 'BCT', class: '3A', quota: 'GN' });
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(containsText(result, 'Missing journey details'), 'Should display missing details warning');
  });

  test('Missing class returns Missing journey details', async () => {
    const params = Promise.resolve({ id: trainId });
    const searchParams = Promise.resolve({ from: 'NDLS', to: 'BCT', date: '2026-10-15', quota: 'GN' });
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(containsText(result, 'Missing journey details'), 'Should display missing details warning');
  });

  test('Missing quota returns Missing journey details', async () => {
    const params = Promise.resolve({ id: trainId });
    const searchParams = Promise.resolve({ from: 'NDLS', to: 'BCT', date: '2026-10-15', class: '3A' });
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(containsText(result, 'Missing journey details'), 'Should display missing details warning');
  });

  test('Direct navigation without search context returns Missing journey details', async () => {
    const params = Promise.resolve({ id: trainId });
    const searchParams = Promise.resolve({});
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(containsText(result, 'Missing journey details'), 'Should display missing details warning');
  });

  test('Complete parameters render analysis without error', async () => {
    const params = Promise.resolve({ id: trainId });
    const searchParams = Promise.resolve({ from: 'NDLS', to: 'BCT', date: '2026-10-15', class: '3A', quota: 'GN' });
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(!containsText(result, 'Missing journey details'), 'Should NOT display missing details warning');
    
    // It should render some valid UI part (e.g. Analysis tab)
    assert.ok(containsText(result, 'Analysis'), 'Should render the Analysis tabs');
  });

  test('Unavailable live availability is handled gracefully', async () => {
    // Force production mode to prevent mock fallback
    resetDataProvider();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
    
    // If the provider fails, it should show Live data unavailable, cannot predict
    const params = Promise.resolve({ id: trainId });
    // using an unknown route to simulate failure
    const searchParams = Promise.resolve({ from: 'XXX', to: 'YYY', date: '2026-10-15', class: '3A', quota: 'GN' });
    const result = await TrainDetailsPage({ params, searchParams });
    assert.ok(!containsText(result, 'Missing journey details'), 'Should pass validation');
    assert.ok(containsText(result, 'Live data unavailable, cannot predict.'), 'Should handle missing availability');
  });
});
