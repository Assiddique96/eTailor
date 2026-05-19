import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withAuth({ permission: "reports.read" }, async ({ user }) => {
  const LIMIT = 5000;
  const shopId = user.shopId!;

  const [customers, jobs, invoices, payments] = await Promise.all([
    db.customer.findMany({ where: { shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
    db.job.findMany({ where: { shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ where: { shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { shopId }, take: LIMIT, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    shopId,
    counts: {
      customers: customers.length,
      jobs: jobs.length,
      invoices: invoices.length,
      payments: payments.length,
    },
    customers, jobs, invoices, payments,
  });
});
