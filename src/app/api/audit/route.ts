import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();

    const canReadAudit = hasPermission(user, "audit.read") || user.platformRole === "SUPER_ADMIN";
    if (!canReadAudit) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const logs = await db.auditLog.findMany({
      where: user.platformRole === "SUPER_ADMIN" ? {} : { shopId: user.shopId ?? undefined },
      include: { user: { select: { id: true, fullName: true, email: true } }, shop: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
}
