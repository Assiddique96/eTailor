import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  reference: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "payments.read")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 50;

    const payments = await db.payment.findMany({
      where: { shopId: user.shopId },
      include: { invoice: true, recordedBy: { select: { id: true, fullName: true } } },
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "payments.write")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = createPaymentSchema.parse(await request.json());

    // Atomic: create payment + recalculate status in one transaction
    const { payment, invoice } = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.findFirst({
        where: { id: body.invoiceId, shopId: user.shopId! },
      });
      if (!inv) throw new Error("NOT_FOUND");

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

      return { payment, invoice };
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "PAYMENT_RECORDED",
      entity: "Payment",
      entityId: payment.id,
      metadata: { amount: body.amount, method: body.method, newStatus: invoice.paymentStatus },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "NOT_FOUND")
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to record payment." }, { status: 500 });
  }
}
