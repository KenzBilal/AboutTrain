import { getAvailabilityProvider } from '../lib/railway/provider';

async function test() {
  const availProvider = getAvailabilityProvider();
  
  if (!availProvider) {
    console.log('No live availability provider configured. Working as expected.');
  } else {
    console.log(`Provider: ${availProvider.providerName}`);
    console.log(`Is Demo: ${availProvider.isDemo}`);
    
    const snapshot = await availProvider.getAvailability({
      trainId: '12345',
      fromStation: 'NDLS',
      toStation: 'HWH',
      journeyDate: '2026-10-01',
      classCode: '3A',
      quota: 'GN',
    });
    
    console.log('Snapshot:', snapshot);
  }
}

test().catch(console.error);
