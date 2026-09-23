import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { RailRadarAvailabilityProvider } from '../lib/railway/railradar-availability';

describe('RailRadarAvailabilityProvider Status Parsing', () => {
  const provider = new RailRadarAvailabilityProvider('test_key');

  test('Parses AVAILABLE status', () => {
    const res = provider.parseStatus('AVAILABLE-0042');
    assert.strictEqual(res.status, 'AVAILABLE');
    assert.strictEqual(res.available_count, 42);
    
    const res2 = provider.parseStatus('CURR_AVBL-0010');
    assert.strictEqual(res2.status, 'AVAILABLE');
    assert.strictEqual(res2.available_count, 10);
  });

  test('Parses RAC status', () => {
    const res = provider.parseStatus('RAC 12');
    assert.strictEqual(res.status, 'RAC');
    assert.strictEqual(res.rac_number, 12);
    
    const res2 = provider.parseStatus('RAC15/RAC12');
    assert.strictEqual(res2.status, 'RAC');
    assert.strictEqual(res2.rac_number, 12);
  });

  test('Parses WL status', () => {
    const res = provider.parseStatus('GNWL24/WL11');
    assert.strictEqual(res.status, 'WL');
    assert.strictEqual(res.waitlist_number, 11);
    
    const res2 = provider.parseStatus('PQWL10/WL5');
    assert.strictEqual(res2.status, 'WL');
    assert.strictEqual(res2.waitlist_number, 5);
  });

  test('Parses CNF status', () => {
    const res = provider.parseStatus('CNF');
    assert.strictEqual(res.status, 'CNF');
  });

  test('Parses REGRET status', () => {
    const res = provider.parseStatus('REGRET/WL');
    assert.strictEqual(res.status, 'REGRET');
  });

  test('Handles unknown status gracefully', () => {
    const res = provider.parseStatus('XYZ_UNKNOWN');
    assert.strictEqual(res.status, 'UNKNOWN');
  });
});
