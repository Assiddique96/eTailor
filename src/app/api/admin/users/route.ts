import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 50;

    const users = await db.user.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      include: { shop: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        platformRole: u.platformRole,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        shop: u.shop,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { userId, isActive } = await request.json();
    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "userId and isActive required." }, { status: 400 });
    }

    // Prevent self-deactivation
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot deactivate your own account." }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await writeAuditLog({
      userId: user.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "User",
      entityId: userId,
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
