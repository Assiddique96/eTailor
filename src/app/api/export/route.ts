import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "reports.read")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const LIMIT = 5000;
    const [customers, jobs, invoices, payments] = await Promise.all([
      db.customer.findMany({ where: { shopId: user.shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
      db.job.findMany({ where: { shopId: user.shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
      db.invoice.findMany({ where: { shopId: user.shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
      db.payment.findMany({ where: { shopId: user.shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      shopId: user.shopId,
      counts: { customers: customers.length, jobs: jobs.length, invoices: invoices.length, payments: payments.length },
      customers,
      jobs,
      invoices,
      payments,
    });
  } catch {
    return NextResponse.json({ error: "Failed to export shop data." }, { status: 500 });
  }
}
