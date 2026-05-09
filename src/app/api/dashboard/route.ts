import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId && user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }

    const whereShop = user.platformRole === "SUPER_ADMIN" ? {} : { shopId: user.shopId! };
    const now = new Date();
    const sevenDays = new Date(now);
    sevenDays.setDate(now.getDate() + 7);

    const [customerCount, activeJobs, dueSoon, revenueAgg] = await Promise.all([
      db.customer.count({ where: whereShop }),
      db.job.count({ where: { ...whereShop, status: { in: ["PENDING", "IN_PROGRESS", "READY_FOR_FITTING"] } } }),
      db.job.count({ where: { ...whereShop, dueDate: { gte: now, lte: sevenDays }, status: { not: "DELIVERED" } } }),
      db.payment.aggregate({ _sum: { amount: true }, where: whereShop }),
    ]);

    return NextResponse.json({
      metrics: {
        customerCount,
        activeJobs,
        dueSoon,
        revenue: revenueAgg._sum.amount ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard metrics." }, { status: 500 });
  }
}
