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

    const shops = await db.shop.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }
        : {},
      include: {
        _count: { select: { customers: true, jobs: true, users: true, invoices: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ shops });
  } catch {
    return NextResponse.json({ error: "Failed to fetch shops." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { shopId, isActive } = await request.json();
    if (!shopId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "shopId and isActive required." }, { status: 400 });
    }

    const shop = await db.shop.update({
      where: { id: shopId },
      data: { isActive },
    });

    await writeAuditLog({
      userId: user.id,
      action: isActive ? "SHOP_ACTIVATED" : "SHOP_SUSPENDED",
      entity: "Shop",
      entityId: shopId,
    });

    return NextResponse.json({ shop });
  } catch {
    return NextResponse.json({ error: "Failed to update shop." }, { status: 500 });
  }
}
