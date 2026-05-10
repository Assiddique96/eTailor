import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const isGlobal = searchParams.get("global") === "true";

    // Global audit: super admin only
    if (isGlobal) {
      if (user.platformRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
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

    // Shop-scoped audit
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }

    // Employees need explicit audit.read permission, admins always get access
    if (user.platformRole === "EMPLOYEE" && !hasPermission(user, "audit.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
}