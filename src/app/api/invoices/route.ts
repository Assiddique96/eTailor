import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().optional(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  dueAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "invoices.read")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 50;

    const invoices = await db.invoice.findMany({
      where: { shopId: user.shopId },
      include: { customer: true, payments: true, job: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "invoices.write")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = createInvoiceSchema.parse(await request.json());
    const total = body.subtotal - body.discount + body.tax;

    // Auto-generate sequential invoice number inside a transaction
    const invoice = await db.$transaction(async (tx) => {
      const count = await tx.invoice.count({ where: { shopId: user.shopId! } });
      const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

      return tx.invoice.create({
        data: {
          shopId: user.shopId!,
          customerId: body.customerId,
          jobId: body.jobId,
          invoiceNumber,
          subtotal: body.subtotal,
          discount: body.discount,
          tax: body.tax,
          total,
          dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
          createdById: user.id,
        },
      });
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: invoice.id,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to create invoice." }, { status: 500 });
  }
}
