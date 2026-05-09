import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "reports.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [customers, jobs, invoices, payments] = await Promise.all([
      db.customer.findMany({ where: { shopId: user.shopId } }),
      db.job.findMany({ where: { shopId: user.shopId } }),
      db.invoice.findMany({ where: { shopId: user.shopId } }),
      db.payment.findMany({ where: { shopId: user.shopId } }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      customers,
      jobs,
      invoices,
      payments,
    });
  } catch {
    return NextResponse.json({ error: "Failed to export shop data." }, { status: 500 });
  }
}
