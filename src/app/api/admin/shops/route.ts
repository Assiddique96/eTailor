import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

export const GET = withAuth({ requireShop: false }, async ({ request, user }) => {
  if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q")?.trim();
  const page  = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 50;

  const shops = await db.shop.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] }
      : {},
    include: { _count: { select: { customers: true, jobs: true, users: true, invoices: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ shops });
});

export const PATCH = withAuth({ requireShop: false }, async ({ request, user }) => {
  if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);

  const { shopId, isActive } = await request.json();
  if (!shopId || typeof isActive !== "boolean") throw new ApiError("shopId and isActive required.", 400);

  const shop = await db.shop.update({ where: { id: shopId }, data: { isActive } });

  await writeAuditLog({
    userId: user.id,
    action: isActive ? "SHOP_ACTIVATED" : "SHOP_SUSPENDED",
    entity: "Shop",
    entityId: shopId,
  });

  return NextResponse.json({ shop });
});
