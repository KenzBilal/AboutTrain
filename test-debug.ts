import { test } from 'node:test';
import * as assert from 'node:assert';
import TrainDetailsPage from './app/trains/[id]/page';

async function run() {
  const params = Promise.resolve({ id: '12951' });
  const searchParams = Promise.resolve({ from: 'XXX', to: 'YYY', date: '2026-10-15', class: '3A', quota: 'GN' });
  const result = await TrainDetailsPage({ params, searchParams });
  console.dir(result, { depth: null });
}

run();
