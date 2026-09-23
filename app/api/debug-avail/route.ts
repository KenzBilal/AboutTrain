import { NextResponse } from 'next/server';
import { getAvailabilityProvider } from '@/lib/railway/provider';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trainNumber = searchParams.get('train') ?? '12014';
  const from = searchParams.get('from') ?? 'PGW';
  const to = searchParams.get('to') ?? 'NDLS';
  const date = searchParams.get('date') ?? '2026-10-01';
  const cls = searchParams.get('class') ?? 'CC';

  const apiKey = process.env.RAILRADAR_API_KEY;

  // 1. Raw fetch directly
  let rawResult: unknown = '(skipped - no API key)';
  if (apiKey) {
    try {
      const url = `https://api.railradar.in/v1/trains/${trainNumber}/seats?from=${from}&to=${to}&class=${cls}&quota=GN&date=${date}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
        cache: 'no-store',
      });
      const data = await res.json();
      rawResult = { httpStatus: res.status, success: data.success, error: data.error, calendar_0: data.data?.calendar?.[0] };
    } catch (e) {
      rawResult = { error: String(e) };
    }
  }

  // 2. Via provider
  const availProvider = getAvailabilityProvider();
  let providerResult: unknown = availProvider ? 'provider initialized' : 'NO PROVIDER (null)';
  if (availProvider) {
    try {
      const result = await availProvider.getAvailability({
        trainId: trainNumber,
        fromStation: from,
        toStation: to,
        journeyDate: date,
        classCode: cls,
        quota: 'GN',
      });
      providerResult = result ?? 'null (getAvailability returned null)';
    } catch (e) {
      providerResult = { error: String(e) };
    }
  }

  return NextResponse.json({
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey?.slice(0, 8),
    trainNumber,
    rawResult,
    providerResult,
  });
}
