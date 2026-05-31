/**
 * Rate limiting — in-memory sliding window (replaces the Postgres-backed version).
 *
 * Why: The DB-backed version added 2 round-trips to every auth request
 * (one COUNT, one INSERT). For a high-traffic login endpoint that adds ~20-40 ms
 * of unnecessary latency and unnecessary DB load.
 *
 * This implementation uses a module-level Map with a cleanup timer.
 * It is correct for single-instance Node.js deployments (most self-hosted
 * and Vercel hobby setups).
 *
 * For multi-instance / serverless deployments (Vercel Pro, Railway scaled):
 *   npm install @upstash/ratelimit @upstash/redis
 *   Replace this module with the Upstash sliding-window rate limiter.
 *   See: https://github.com/upstash/ratelimit-js
 *
 * The RateLimitAttempt Prisma model can be kept for audit purposes or removed
 * in a future migration once this is confirmed stable in production.
 */
import { NextResponse } from "next/server";

type WindowEntry = { timestamps: number[] };

const windows = new Map<string, WindowEntry>();

// Clean up stale keys every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (entry.timestamps.length === 0 || now - entry.timestamps[entry.timestamps.length - 1] > 15 * 60 * 1000) {
      windows.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = windows.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    windows.set(key, entry);
  }

  // Slide the window — discard timestamps older than the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: limit - entry.timestamps.length };
}

export function rateLimitResponse(_rl: { success: false; remaining: number }) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": "900" } }
  );
}
