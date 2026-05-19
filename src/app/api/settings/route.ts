import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const shopSchema = z.object({
  name:    z.string().min(2, "Shop name must be at least 2 characters."),
  email:   z.string().email().optional().nullable(),
  phone:   z.string().optional().nullable(),
  address:      z.string().optional().nullable(),
  currency:     z.string().length(3).optional(),
  bankDetails:  z.string().max(500).optional().nullable(),
  paymentTerms: z.string().max(200).optional().nullable(),
});

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email:    z.string().email("Invalid email address."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword:     z.string().min(8, "New password must be at least 8 characters."),
});

export const GET = withAuth({ requireShop: false }, async ({ user }) => {
  const shop = user.shopId
    ? await db.shop.findUnique({
        where: { id: user.shopId },
        select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logoUrl: true, currency: true, bankDetails: true, paymentTerms: true },
      })
    : null;

  return NextResponse.json({
    shop,
    profile: {
      id:           user.id,
      fullName:     user.fullName,
      email:        user.email,
      platformRole: user.platformRole,
    },
  });
});

export const PATCH = withAuth({ requireShop: false }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const body = await request.json();

  if (section === "shop") {
    if (!user.shopId) throw new ApiError("Shop context required.", 400);
    const data = shopSchema.parse(body);
    const shop = await db.shop.update({ where: { id: user.shopId }, data });
    await writeAuditLog({
      shopId: user.shopId, userId: user.id,
      action: "SHOP_SETTINGS_UPDATED", entity: "Shop", entityId: user.shopId,
    });
    return NextResponse.json({ shop });
  }

  if (section === "profile") {
    const data = profileSchema.parse(body);
    const existing = await db.user.findFirst({
      where: { email: data.email, id: { not: user.id } },
    });
    if (existing) throw new ApiError("Email already in use.", 409);
    const updated = await db.user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      profile: { id: updated.id, fullName: updated.fullName, email: updated.email },
    });
  }

  if (section === "password") {
    const { currentPassword, newPassword } = passwordSchema.parse(body);
    const fresh = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    const valid = fresh && await bcrypt.compare(currentPassword, fresh.passwordHash);
    if (!valid) throw new ApiError("Current password is incorrect.", 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    return NextResponse.json({ message: "Password updated." });
  }

  throw new ApiError("Unknown settings section.", 400);
});
