import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  try {
    const body = bodySchema.parse(await request.json());

    const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const { token } = await createSessionToken({
      sub: user.id,
      shopId: user.shopId ?? undefined,
      platformRole: user.platformRole,
    });

    await setSessionCookie(token);

    // Fire-and-forget non-critical updates (don't let them block or throw)
    await Promise.allSettled([
      db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      writeAuditLog({
        shopId: user.shopId,
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      }),
    ]);

    return NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        platformRole: user.platformRole,
        shopId: user.shopId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const flat = error.flatten();
      const msg = flat.formErrors?.[0] ?? Object.values(flat.fieldErrors ?? {}).flat()[0] ?? "Invalid input.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("[LOGIN_ERROR]", error); // surfaces the real cause
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}