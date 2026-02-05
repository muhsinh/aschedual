import { createClient } from "redis";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

type MemoryState = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, MemoryState>();
let redisClientPromise: Promise<any | null> | null = null;

async function getRedisClient() {
  const url = process.env.RATE_LIMIT_REDIS_URL;
  if (!url) {
    return null;
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      try {
        const client = createClient({ url });
        client.on("error", () => {
          // Fallback handled by callers.
        });
        await client.connect();
        return client;
      } catch {
        return null;
      }
    })();
  }

  return redisClientPromise;
}

function consumeMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const state = memoryStore.get(key);

  if (!state || state.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(limit - 1, 0) };
  }

  state.count += 1;
  return {
    allowed: state.count <= limit,
    remaining: Math.max(limit - state.count, 0)
  };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    return consumeMemoryRateLimit(key, limit, windowSeconds * 1000);
  }

  try {
    const redisKey = `rate:${key}`;
    const count = await client.incr(redisKey);

    if (count === 1) {
      await client.expire(redisKey, windowSeconds);
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0)
    };
  } catch {
    return consumeMemoryRateLimit(key, limit, windowSeconds * 1000);
  }
}
