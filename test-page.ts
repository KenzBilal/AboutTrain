import TrainDetailsPage from './app/trains/[id]/page';

async function run() {
  const params = Promise.resolve({ id: '123' });
  const searchParams = Promise.resolve({ from: 'PGW', to: 'NDLS' });
  const result = await TrainDetailsPage({ params, searchParams });
  console.log(JSON.stringify(result).includes('Missing journey details'));
}

run();
