import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = withAuth({ requireShop: false }, async ({ user }) => {
  if (user.platformRole !== "SUPER_ADMIN") throw new ApiError("Forbidden.", 403);

  const [totalShops, activeShops, totalUsers, totalCustomers,
         totalJobs, activeJobs, totalRevenue, recentShops] = await Promise.all([
    db.shop.count(),
    db.shop.count({ where: { isActive: true } }),
    db.user.count(),
    db.customer.count(),
    db.job.count(),
    db.job.count({ where: { status: { in: ["PENDING","IN_PROGRESS","READY_FOR_FITTING"] } } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.shop.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { customers: true, jobs: true, users: true } } },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalShops, activeShops, totalUsers, totalCustomers,
      totalJobs, activeJobs,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    },
    recentShops,
  });
});
