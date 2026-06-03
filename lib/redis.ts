import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export function getRedis() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return globalForRedis.redis;
}

export async function readCache(key: string) {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: string, ttlSeconds: number) {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    // Redis is optional; failures should never block recognition workflows.
  }
}

export async function invalidateCache(pattern: string) {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    const keys: string[] = [];
    let cursor = "0";

    do {
      const [nextCursor, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Best-effort cache invalidation only.
  }
}
