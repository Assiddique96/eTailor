// lib/rate-limit.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const count = await db.rateLimitAttempt.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= limit) {
    return { success: false, remaining: 0 };
  }

  await db.rateLimitAttempt.create({ data: { key } });

  if (Math.random() < 0.1) {
    await db.rateLimitAttempt.deleteMany({
      where: { createdAt: { lt: windowStart } },
    });
  }

  return { success: true, remaining: limit - count - 1 };
}

export function rateLimitResponse(rl: { success: false; remaining: number }) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": "900" } }
  );
}