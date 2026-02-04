type RateLimitState = { count: number; resetAt: number };

const memory = new Map<string, RateLimitState>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const state = memory.get(key);
  if (!state || state.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (state.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  state.count += 1;
  return { allowed: true, remaining: limit - state.count };
}
