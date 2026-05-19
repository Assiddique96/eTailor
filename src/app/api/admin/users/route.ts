import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { revokeSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

export const GET = withAuth({ requireShop: false }, async ({ request, user }) => {
  if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q")?.trim();
  const page  = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 50;

  const users = await db.user.findMany({
    where: q
      ? { OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email:    { contains: q, mode: "insensitive" } },
        ] }
      : {},
    include: { shop: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email,
      platformRole: u.platformRole, isActive: u.isActive,
      lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
      shop: u.shop,
    })),
  });
});

export const PATCH = withAuth({ requireShop: false }, async ({ request, user }) => {
  if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);

  const { userId, isActive } = await request.json();
  if (!userId || typeof isActive !== "boolean") throw new ApiError("userId and isActive required.", 400);
  if (userId === user.id) throw new ApiError("Cannot deactivate your own account.", 400);

  const updated = await db.user.update({ where: { id: userId }, data: { isActive } });

  // Immediately revoke all sessions for the affected user
  await revokeSession({ userId });

  await writeAuditLog({
    userId: user.id,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entity: "User", entityId: userId,
  });

  return NextResponse.json({ user: updated });
});
