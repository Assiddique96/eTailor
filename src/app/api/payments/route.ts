import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";

const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  reference: z.string().optional(),
});

export const GET = withAuth({ permission: "payments.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 50;

  const [payments, total] = await db.$transaction([
    db.payment.findMany({
      where: { shopId: user.shopId! },
      include: { invoice: true, recordedBy: { select: { id: true, fullName: true } } },
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where: { shopId: user.shopId! } }),
  ]);

  return NextResponse.json({ payments, total, page, limit });
});

export const POST = withAuth({ permission: "payments.write" }, async ({ request, user }) => {
  const body = createPaymentSchema.parse(await request.json());

  const { payment, invoice } = await db.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({
      where: { id: body.invoiceId, shopId: user.shopId! },
    });
    if (!inv) throw new ApiError("Invoice not found.", 404);

    const payment = await tx.payment.create({
      data: {
        shopId: user.shopId!,
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method,
        reference: body.reference,
        recordedById: user.id,
      },
    });

    const paidAgg = await tx.payment.aggregate({
      where: { invoiceId: body.invoiceId },
      _sum: { amount: true },
    });
    const paidTotal = Number(paidAgg._sum.amount ?? 0);
    const invoiceTotal = Number(inv.total);
    const paymentStatus =
      paidTotal <= 0 ? "UNPAID" : paidTotal < invoiceTotal ? "PARTIAL" : "PAID";

    const invoice = await tx.invoice.update({
      where: { id: body.invoiceId },
      data: { paymentStatus },
    });

    // Audit log inside the transaction — rolls back atomically if write fails
    await writeAuditLog(
      {
        shopId: user.shopId,
        userId: user.id,
        action: "PAYMENT_RECORDED",
        entity: "Payment",
        entityId: payment.id,
        metadata: { amount: body.amount, method: body.method, newStatus: paymentStatus },
      },
      tx
    );

    return { payment, invoice };
  });

  // Notify shop — fire-and-forget so it never blocks the response
  createNotification({
    shopId:     user.shopId!,
    type:       "PAYMENT_RECEIVED",
    title:      "Payment recorded",
    body:       `₦${Number(body.amount).toLocaleString()} received via ${body.method}. Invoice now ${invoice.paymentStatus}.`,
    entityId:   payment.id,
    entityType: "Payment",
  }).catch(console.warn);

  return NextResponse.json({ payment }, { status: 201 });
});
