import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const shopSchema = z.object({
  name:    z.string().min(2, "Shop name must be at least 2 characters."),
  email:   z.string().email().optional().nullable(),
  phone:   z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email:    z.string().email("Invalid email address."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword:     z.string().min(8, "New password must be at least 8 characters."),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });

    const shop = await db.shop.findUnique({
      where: { id: user.shopId },
      select: { id: true, name: true, slug: true, email: true, phone: true, address: true },
    });

    return NextResponse.json({
      shop,
      profile: {
        id:           user.id,
        fullName:     user.fullName,
        email:        user.email,
        platformRole: user.platformRole,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const body = await request.json();

    // ── Shop profile ──────────────────────────────────────
    if (section === "shop") {
      if (user.platformRole !== "SHOP_ADMIN" && user.platformRole !== "SUPER_ADMIN")
        return NextResponse.json({ error: "Only shop admins can update shop settings." }, { status: 403 });

      const data = shopSchema.parse(body);
      const shop = await db.shop.update({
        where: { id: user.shopId },
        data,
        select: { id: true, name: true, slug: true, email: true, phone: true, address: true },
      });

      await writeAuditLog({
        shopId: user.shopId,
        userId: user.id,
        action: "SHOP_UPDATED",
        entity: "Shop",
        entityId: user.shopId,
      });

      return NextResponse.json({ shop });
    }

    // ── Personal profile ──────────────────────────────────
    if (section === "profile") {
      const data = profileSchema.parse(body);

      // Check email not taken by another user
      if (data.email !== user.email) {
        const existing = await db.user.findUnique({ where: { email: data.email } });
        if (existing)
          return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
      }

      const updated = await db.user.update({
        where: { id: user.id },
        data: { fullName: data.fullName, email: data.email },
        select: { id: true, fullName: true, email: true, platformRole: true },
      });

      await writeAuditLog({
        shopId: user.shopId,
        userId: user.id,
        action: "USER_PROFILE_UPDATED",
        entity: "User",
        entityId: user.id,
      });

      return NextResponse.json({ profile: updated });
    }

    // ── Password change ───────────────────────────────────
    if (section === "password") {
      const data = passwordSchema.parse(body);

      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      const valid = await bcrypt.compare(data.currentPassword, fullUser!.passwordHash);
      if (!valid)
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

      const passwordHash = await bcrypt.hash(data.newPassword, 12);
      await db.user.update({ where: { id: user.id }, data: { passwordHash } });

      await writeAuditLog({
        shopId: user.shopId,
        userId: user.id,
        action: "USER_PASSWORD_CHANGED",
        entity: "User",
        entityId: user.id,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid section." }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
