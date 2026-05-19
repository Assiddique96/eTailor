/**
 * Rate limiter backed by Upstash Redis.
 *
 * Works correctly across all Vercel function instances and regions —
 * the in-memory Map approach was wiped on every cold start, making it
 * ineffective in production.
 *
 * Required env vars (add to .env.local):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Both are available from your Upstash console after creating a Redis database.
 * The free tier (10,000 commands/day) is sufficient for most small shops.
 *
 * Falls back to a permissive in-memory limiter when env vars are absent
 * so development works without Redis configured.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  resetAt:   number; // Unix ms timestamp
}

// ── Upstash client ────────────────────────────────────────────────────────────
function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Cache limiters so they're not re-created on every request
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${limit}:${windowSeconds}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
    }));
  }
  return limiters.get(key)!;
}

// ── In-memory fallback (dev only) ─────────────────────────────────────────────
type WindowEntry = { count: number; resetAt: number };
const devStore = new Map<string, WindowEntry>();

function devLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now   = Date.now();
  const entry = devStore.get(key);
  if (!entry || now > entry.resetAt) {
    devStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function checkRateLimit(
  key:       string,
  limit    = 10,
  windowMs = 15 * 60 * 1000
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const limiter = getLimiter(limit, windowSeconds);

  if (!limiter) {
    // No Redis configured — use dev fallback
    return devLimit(key, limit, windowMs);
  }

  const result = await limiter.limit(key);
  return {
    success:   result.success,
    remaining: result.remaining,
    resetAt:   result.reset,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSecs = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type":      "application/json",
        "Retry-After":       String(retryAfterSecs),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}
