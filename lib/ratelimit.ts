import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis ? Redis.fromEnv() : null;

/**
 * Rate limit factory. Caches limiter instances by name so we don't recreate
 * them on every request. If Upstash is not configured, returns a no-op
 * limiter (useful for local dev without Redis).
 */
const cache = new Map<string, Ratelimit | null>();

export function getLimiter(name: string, limit: number, windowSec: number) {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  const limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        prefix: `rl:${name}`,
        analytics: false,
      })
    : null;
  cache.set(name, limiter);
  return limiter;
}

export async function checkLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number; reset: number }> {
  const limiter = getLimiter(name, limit, windowSec);
  if (!limiter) return { ok: true, remaining: limit, reset: 0 };
  const result = await limiter.limit(identifier);
  return {
    ok: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
