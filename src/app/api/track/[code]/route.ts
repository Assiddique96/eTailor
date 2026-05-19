import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public — no auth required. Returns safe job data for the customer portal. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  const job = await db.job.findFirst({
    where: { trackingCode: code },
    select: {
      id: true, title: true, status: true, dueDate: true,
      trackingCode: true, description: true,
      customer: { select: { firstName: true, lastName: true } },
      shop: { select: { name: true, logoUrl: true } },
      invoice: {
        select: {
          invoiceNumber: true, total: true, paymentStatus: true,
          lines: { orderBy: { sortOrder: "asc" },
            select: { description: true, quantity: true, unitPrice: true, amount: true } },
          payments: { select: { amount: true, method: true, paidAt: true },
            orderBy: { paidAt: "desc" } },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Order not found. Please check your tracking code." }, { status: 404 });
  }

  return NextResponse.json({ job });
}
