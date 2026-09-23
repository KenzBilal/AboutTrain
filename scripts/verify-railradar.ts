import { RailRadarAvailabilityProvider } from '../lib/railway/railradar-availability';

async function verifyAPI() {
  const apiKey = process.env.RAILRADAR_API_KEY;
  if (!apiKey) {
    console.error("No RAILRADAR_API_KEY found");
    return;
  }
  
  const provider = new RailRadarAvailabilityProvider(apiKey);
  
  const testCases = [
    { trainId: '12951', fromStation: 'MMCT', toStation: 'NDLS', journeyDate: '2026-09-25', classCode: '3A', quota: 'GN' },
    { trainId: '12004', fromStation: 'NDLS', toStation: 'LKO', journeyDate: '2026-09-25', classCode: 'CC', quota: 'GN' },
    { trainId: '12302', fromStation: 'NDLS', toStation: 'HWH', journeyDate: '2026-09-25', classCode: '3A', quota: 'GN' }
  ];

  for (const t of testCases) {
    console.log(`Testing ${t.trainId} ${t.fromStation}->${t.toStation} on ${t.journeyDate}...`);
    const start = Date.now();
    const result = await provider.getAvailability(t);
    const ms = Date.now() - start;
    
    if (result) {
      console.log(`Success in ${ms}ms!`);
      console.log(result);
      
      // Test cache
      console.log('Testing cache...');
      const start2 = Date.now();
      const result2 = await provider.getAvailability(t);
      const ms2 = Date.now() - start2;
      console.log(`Second request took ${ms2}ms (should be much faster if cached)`);
      return;
    } else {
      console.log(`Failed in ${ms}ms.`);
    }
  }
}

verifyAPI().catch(console.error);
