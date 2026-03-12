import { redis } from "./redis";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // seconds until window resets
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * Strategy: store each request as a scored member (score = timestamp ms).
 * Count only members within the current window; evict old ones atomically.
 *
 * This is O(log N) per request and handles burst traffic correctly —
 * unlike fixed-window counters which allow 2x the limit at window boundaries.
 */
export async function rateLimit(
  identifier: string,
  { limit = 10, windowSec = 60 }: { limit?: number; windowSec?: number } = {}
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSec * 1000;

  // Pipeline: evict stale, add current, count, set expiry
  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  pipe.zcount(key, windowStart, "+inf");
  pipe.expire(key, windowSec);

  const results = await pipe.exec();
  const count = results[2] as number;

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    reset: windowSec,
  };
}
