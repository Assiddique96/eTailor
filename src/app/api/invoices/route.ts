import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().optional(),
  invoiceNumber: z.string().min(1),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  dueAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "invoices.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const invoices = await db.invoice.findMany({
      where: { shopId: user.shopId },
      include: { customer: true, payments: true, job: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "invoices.write")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = createInvoiceSchema.parse(await request.json());
    const total = body.subtotal - body.discount + body.tax;
    const invoice = await db.invoice.create({
      data: {
        shopId: user.shopId,
        customerId: body.customerId,
        jobId: body.jobId,
        invoiceNumber: body.invoiceNumber,
        subtotal: body.subtotal,
        discount: body.discount,
        tax: body.tax,
        total,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        createdById: user.id,
      },
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create invoice." }, { status: 500 });
  }
}
