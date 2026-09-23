import { test, describe } from 'node:test';
import * as assert from 'node:assert';

/**
 * Unit tests for TrainCard Full Analysis URL construction.
 * These tests validate the parameter-building logic in isolation,
 * without rendering React components.
 *
 * Requirements covered:
 * A. Full Analysis preserves date/class/quota
 * B. Full Analysis preserves origin/destination
 * C. Complete search context -> complete detail URL
 * D. Missing params do NOT silently replace valid values with empty strings
 * E. Detail page shows "Missing journey details" when params genuinely absent
 *    (covered in full-analysis.test.ts — validated here via URL building logic)
 */

// Mirror of the URL-building logic extracted from TrainCard
function buildFullAnalysisUrl(
  trainId: string,
  fromStationCode: string,
  toStationCode: string,
  searchContext: { from?: string; to?: string; date?: string; classCode?: string; quota?: string } | undefined,
  availability: { journey_date?: string; class_code?: string; quota?: string } | null | undefined,
): string {
  const from = searchContext?.from || fromStationCode;
  const to = searchContext?.to || toStationCode;
  const date = searchContext?.date || availability?.journey_date || '';
  const classCode = searchContext?.classCode || availability?.class_code || '';
  const quota = searchContext?.quota || availability?.quota || '';
  const params = new URLSearchParams({ from, to, date, class: classCode, quota });
  return `/trains/${trainId}?${params.toString()}`;
}

describe('TrainCard Full Analysis URL Construction', () => {
  const trainId = '12951';
  const fromCode = 'PGW';
  const toCode = 'NDLS';

  // Requirement A: date/class/quota preserved from searchContext
  test('A: Full Analysis preserves date, class, and quota from searchContext', () => {
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      null,
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-01', 'date must be preserved');
    assert.strictEqual(parsed.searchParams.get('class'), '3A', 'class must be preserved');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'quota must be preserved');
  });

  // Requirement B: origin/destination preserved
  test('B: Full Analysis preserves origin and destination', () => {
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      null,
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('from'), 'PGW', 'from must be preserved');
    assert.strictEqual(parsed.searchParams.get('to'), 'NDLS', 'to must be preserved');
  });

  // Requirement C: complete search context -> complete detail URL with no empty params
  test('C: Complete search context produces complete detail URL', () => {
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      null,
    );
    const parsed = new URL(url, 'http://localhost');
    const emptyParams = ['from', 'to', 'date', 'class', 'quota'].filter(
      (k) => !parsed.searchParams.get(k),
    );
    assert.deepStrictEqual(emptyParams, [], `These params must not be empty: ${emptyParams.join(', ')}`);
  });

  // Requirement D: valid searchContext values must NOT be silently replaced with empty strings
  test('D: searchContext values are not silently replaced with empty strings', () => {
    // Simulate availability with empty/missing fields (as might happen with partial API response)
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      { journey_date: '', class_code: '', quota: '' }, // availability has empty strings
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-01', 'date from searchContext must not be overridden by empty availability.journey_date');
    assert.strictEqual(parsed.searchParams.get('class'), '3A', 'class from searchContext must not be overridden by empty availability.class_code');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'quota from searchContext must not be overridden by empty availability.quota');
  });

  // Requirement D (variant): availability data present — searchContext still wins as primary
  test('D: searchContext takes priority over availability fields', () => {
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      { journey_date: '2099-01-01', class_code: '2A', quota: 'CK' }, // availability has different values
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-01', 'searchContext.date takes priority');
    assert.strictEqual(parsed.searchParams.get('class'), '3A', 'searchContext.classCode takes priority');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'searchContext.quota takes priority');
  });

  // Requirement D (variant): no searchContext — falls back to availability without throwing
  test('D: Falls back to availability when searchContext is absent (no silent crash)', () => {
    const url = buildFullAnalysisUrl(
      trainId,
      fromCode,
      toCode,
      undefined, // no searchContext
      { journey_date: '2026-10-01', class_code: '3A', quota: 'GN' },
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-01', 'date falls back to availability');
    assert.strictEqual(parsed.searchParams.get('class'), '3A', 'class falls back to availability');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'quota falls back to availability');
  });

  // Requirement D: no searchContext and no availability -> empty strings, not an exception
  test('D: No searchContext and no availability produces empty but safe URL', () => {
    assert.doesNotThrow(() => {
      buildFullAnalysisUrl(trainId, fromCode, toCode, undefined, null);
    }, 'Must not throw when both searchContext and availability are absent');

    const url = buildFullAnalysisUrl(trainId, fromCode, toCode, undefined, null);
    const parsed = new URL(url, 'http://localhost');
    // from/to fall back to station codes from the train result
    assert.strictEqual(parsed.searchParams.get('from'), 'PGW');
    assert.strictEqual(parsed.searchParams.get('to'), 'NDLS');
    // date/class/quota will be empty — detail page will show "Missing journey details"
    assert.strictEqual(parsed.searchParams.get('date'), '');
  });

  // Exact scenario from the bug report: PGW → NDLS, 2026-10-01, 3A, GN
  test('Exact bug scenario: PGW → NDLS with date/class/quota in searchContext', () => {
    const url = buildFullAnalysisUrl(
      '12925',
      'PGW',
      'NDLS',
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      null, // no availability
    );
    assert.ok(url.includes('from=PGW'), `URL missing from=PGW: ${url}`);
    assert.ok(url.includes('to=NDLS'), `URL missing to=NDLS: ${url}`);
    assert.ok(url.includes('date=2026-10-01'), `URL missing date=2026-10-01: ${url}`);
    assert.ok(url.includes('class=3A'), `URL missing class=3A: ${url}`);
    assert.ok(url.includes('quota=GN'), `URL missing quota=GN: ${url}`);
  });

  // Alternate journey: AWL → NDLS, 2026-10-02, SL, GN
  test('Alternate journey: AWL → NDLS with different date/class produces correct URL', () => {
    const url = buildFullAnalysisUrl(
      '12314',
      'AWL',
      'NDLS',
      { from: 'AWL', to: 'NDLS', date: '2026-10-02', classCode: 'SL', quota: 'GN' },
      null,
    );
    const parsed = new URL(url, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('from'), 'AWL', 'from=AWL');
    assert.strictEqual(parsed.searchParams.get('to'), 'NDLS', 'to=NDLS');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-02', 'date=2026-10-02');
    assert.strictEqual(parsed.searchParams.get('class'), 'SL', 'class=SL');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'quota=GN');
  });

  // THE ACTUAL PRODUCTION BUG: detail page rendered TrainCard WITHOUT searchContext.
  // Without searchContext, and without availability, all params become empty strings.
  // This test documents the broken behavior and confirms the fix (pass searchContext always).
  test('Root cause: TrainCard on detail page without searchContext produces broken URL', () => {
    // Before fix: detail page called <TrainCard result={result} /> — no searchContext.
    // This causes date/class/quota to be '' because availability is also null in production.
    const brokenUrl = buildFullAnalysisUrl('12925', 'PGW', 'NDLS', undefined, null);
    const parsed = new URL(brokenUrl, 'http://localhost');
    // from/to come from station codes (correct), but date/class/quota are empty (broken)
    assert.strictEqual(parsed.searchParams.get('from'), 'PGW');
    assert.strictEqual(parsed.searchParams.get('to'), 'NDLS');
    assert.strictEqual(parsed.searchParams.get('date'), '', 'Without searchContext, date is empty — this was the bug');
    assert.strictEqual(parsed.searchParams.get('class'), '', 'Without searchContext, class is empty — this was the bug');
    assert.strictEqual(parsed.searchParams.get('quota'), '', 'Without searchContext, quota is empty — this was the bug');
  });

  test('Fix verified: detail page TrainCard WITH searchContext produces correct URL', () => {
    // After fix: detail page calls <TrainCard result={result} searchContext={{ from, to, date, classCode, quota }} />
    const fixedUrl = buildFullAnalysisUrl(
      '12925',
      'PGW',
      'NDLS',
      { from: 'PGW', to: 'NDLS', date: '2026-10-01', classCode: '3A', quota: 'GN' },
      null, // still no availability in production
    );
    const parsed = new URL(fixedUrl, 'http://localhost');
    assert.strictEqual(parsed.searchParams.get('from'), 'PGW');
    assert.strictEqual(parsed.searchParams.get('to'), 'NDLS');
    assert.strictEqual(parsed.searchParams.get('date'), '2026-10-01', 'With searchContext, date is preserved');
    assert.strictEqual(parsed.searchParams.get('class'), '3A', 'With searchContext, class is preserved');
    assert.strictEqual(parsed.searchParams.get('quota'), 'GN', 'With searchContext, quota is preserved');
  });
});
