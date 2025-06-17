import { createCache } from 'cache-manager';

let cacheManager: ReturnType<typeof createCache>;

export async function setupCache(): Promise<void> {
  cacheManager = createCache({
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
  });
}

export function getCache(): ReturnType<typeof createCache> {
  if (!cacheManager) {
    throw new Error('Cache not initialized. Call setupCache() first.');
  }
  return cacheManager;
}
