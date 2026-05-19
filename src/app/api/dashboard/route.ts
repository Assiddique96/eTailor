import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withAuth({}, async ({ user }) => {
  const shopId = user.shopId!;
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const shopInfo = await db.shop.findUnique({
    where: { id: shopId },
    select: { name: true, logoUrl: true },
  });

  const [customerCount, activeJobs, dueSoon, revenueAgg] = await Promise.all([
    db.customer.count({ where: { shopId } }),
    db.job.count({ where: { shopId, status: { in: ["PENDING", "IN_PROGRESS", "READY_FOR_FITTING"] } } }),
    db.job.count({ where: { shopId, dueDate: { gte: now, lte: next7Days }, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    db.payment.aggregate({ where: { shopId }, _sum: { amount: true } }),
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await db.payment.findMany({
    where: { shopId, paidAt: { gte: sixMonthsAgo } },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const monthMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthMap[key] = 0;
  }
  for (const p of payments) {
    const key = new Date(p.paidAt).toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in monthMap) monthMap[key] += Number(p.amount);
  }
  const revenueChart = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));

  const jobStatuses = await db.job.groupBy({
    by: ["status"],
    where: { shopId },
    _count: { status: true },
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    READY_FOR_FITTING: "Fitting",
    COMPLETED: "Completed",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  const jobsChart = jobStatuses.map((s) => ({
    status: STATUS_LABELS[s.status] ?? s.status,
    count: s._count.status,
  }));

  const recentJobs = await db.job.findMany({
    where: { shopId },
    include: { customer: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    shop: shopInfo ? { name: shopInfo.name, logoUrl: shopInfo.logoUrl } : null,
    metrics: {
      customerCount,
      activeJobs,
      dueSoon,
      revenue: Number(revenueAgg._sum.amount ?? 0),
    },
    revenueChart,
    jobsChart,
    recentJobs,
  });
});
