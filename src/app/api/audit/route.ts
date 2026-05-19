import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withAuth({ requireShop: false }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const isGlobal = searchParams.get("global") === "true";

  if (isGlobal) {
    if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);
    const logs = await db.auditLog.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ logs });
  }

  if (!user.shopId) throw new ApiError("Shop context required.", 400);

  const logs = await db.auditLog.findMany({
    where: { shopId: user.shopId },
    include: {
      user: { select: { fullName: true, email: true } },
      shop: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ logs });
});
