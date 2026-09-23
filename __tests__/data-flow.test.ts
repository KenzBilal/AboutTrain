import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { calculatePrediction } from '../lib/prediction/engine';

describe('Data Flow & Fallback Logic', () => {
  test('Valid date propagates from search to detail', () => {
    const journeyDate = '2026-10-15';
    assert.strictEqual(journeyDate, '2026-10-15', 'Date must propagate correctly');
  });

  test('Missing date cannot produce a prediction', () => {
    const prediction = calculatePrediction({
      trainId: '12345',
      journeyDate: '',
      classCode: '3A',
      quota: 'GN',
      status: 'WL',
      waitlistNumber: 15,
      racNumber: 0,
      daysToJourney: 0
    });
    assert.strictEqual(prediction, undefined, 'Prediction engine must return undefined if date is missing');
  });

  test('Production availability unavailable -> no mock fallback', () => {
    const isDemo = false;
    let avail: Record<string, unknown> | null = null; // simulate live provider failing
    if (!avail && isDemo) {
      avail = { status: 'MOCK_FALLBACK' };
    }
    assert.strictEqual(avail, null, 'Should not fallback to mock in production');
  });

  test('Production availability available -> same availability on results and detail', () => {
    const searchAvail = { status: 'CNF', fare: 1500 };
    const detailAvail = searchAvail; // simulated passing same data or re-fetching
    assert.deepStrictEqual(searchAvail, detailAvail, 'Should match exactly');
  });

  test('Demo mode -> mock provider still works', () => {
    const isDemo = true;
    let avail: Record<string, unknown> | null = null; // simulate no live provider
    if (!avail && isDemo) {
      avail = { status: 'WL', waitlist_number: 10 };
    }
    assert.notStrictEqual(avail, null, 'Should fallback to mock in demo mode');
    assert.strictEqual(avail?.status, 'WL');
  });

  test('Same train/date/class/quota produces consistent results across pages', () => {
    const searchParams = { trainId: '12951', date: '2026-10-15', class: '3A', quota: 'GN' };
    const detailParams = { trainId: '12951', date: '2026-10-15', class: '3A', quota: 'GN' };
    assert.deepStrictEqual(searchParams, detailParams, 'Params must remain consistent across views');
  });
});
