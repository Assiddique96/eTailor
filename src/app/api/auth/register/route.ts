import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const bodySchema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  shopSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/, 
      "Slug can only contain lowercase letters, numbers, and hyphens (no spaces or capitals)"
    ),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  // 3 registrations per IP per hour — prevent account farming
  const ip = getClientIp(request);
  
  // 💡 Add 'await' here too
  const rl = await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
  
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  try {
    const json = await request.json();
    const result = bodySchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const body = result.data;

    const existingUser = await db.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const existingShop = await db.shop.findUnique({ where: { slug: body.shopSlug } });
    if (existingShop) {
      return NextResponse.json({ error: "Shop slug already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const created = await db.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: body.shopName,
          slug: body.shopSlug,
        },
      });

      const owner = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          passwordHash,
          platformRole: "SHOP_ADMIN",
          shopId: shop.id,
        },
      });

      return { shop, owner };
    });

    const { token } = await createSessionToken({
      sub: created.owner.id,
      shopId: created.shop.id,
      platformRole: created.owner.platformRole,
    });
    await setSessionCookie(token);

    await writeAuditLog({
      shopId: created.shop.id,
      userId: created.owner.id,
      action: "SHOP_REGISTERED",
      entity: "Shop",
      entityId: created.shop.id,
    });

    return NextResponse.json({
      message: "Shop registered successfully.",
      user: {
        id: created.owner.id,
        fullName: created.owner.fullName,
        email: created.owner.email,
        platformRole: created.owner.platformRole,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Failed to register shop." }, { status: 500 });
  }
}