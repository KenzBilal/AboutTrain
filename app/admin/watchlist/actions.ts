'use server';

export async function triggerCollectionAction() {
  const secret = process.env.INGESTION_SECRET;
  
  if (!secret) {
    throw new Error('INGESTION_SECRET is not configured on the server');
  }

  // Use absolute URL for server-to-server fetch in Next.js Server Actions
  // In production it will be the real site URL, locally it's localhost
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/admin/collect`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secret}`
      },
      // Ensure we don't cache this fetch
      cache: 'no-store'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Trigger failed');
    }
    return { success: true, results: data.results };
  } catch (err: unknown) {
    throw new Error((err as Error).message || 'Server error triggering collection');
  }
}
