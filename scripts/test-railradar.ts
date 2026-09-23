import { getAvailabilityProvider } from '../lib/railway/provider';

async function test() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://fake-supabase';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-key';
  process.env.RAILRADAR_API_KEY = 'rg_e1a498621268469a9e8f55d02b7b57f7';
  
  const provider = getAvailabilityProvider();
  if (!provider) {
    throw new Error("Provider should not be null when API key is set");
  }
  
  console.log(`Provider: ${provider.providerName}`);
  
  // This might return null or actual data depending on the RailRadar response
  const snapshot = await provider.getAvailability({
    trainId: '12274',
    fromStation: 'NDLS',
    toStation: 'HWH',
    journeyDate: '2026-10-01',
    classCode: '3A',
    quota: 'GN',
  });
  
  console.log('Result:', snapshot);
}

test().catch(console.error);
