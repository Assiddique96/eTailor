import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const lineSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity:    z.number().positive().default(1),
  unitPrice:   z.number().nonnegative(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  jobId:      z.string().optional(),
  lines:      z.array(lineSchema).min(1, "At least one line item is required"),
  discount:   z.number().nonnegative().default(0),
  tax:        z.number().nonnegative().default(0),
  dueAt:      z.string().datetime().optional(),
});

export const GET = withAuth({ permission: "invoices.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = 50;

  const items = await db.invoice.findMany({
    where: { shopId: user.shopId! },
    include: { customer: true, payments: true, job: true, lines: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
    take:   limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore    = items.length > limit;
  const invoices   = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? invoices[invoices.length - 1].id : null;

  return NextResponse.json({ invoices, nextCursor });
});

export const POST = withAuth({ permission: "invoices.write" }, async ({ request, user }) => {
  const body = createInvoiceSchema.parse(await request.json());

  // Calculate amounts from line items
  const lines   = body.lines.map((l) => ({ ...l, amount: l.quantity * l.unitPrice }));
  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const total    = subtotal - body.discount + body.tax;

  const invoice = await db.$transaction(async (tx) => {
    const count = await tx.invoice.count({ where: { shopId: user.shopId! } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    const created = await tx.invoice.create({
      data: {
        shopId:      user.shopId!,
        customerId:  body.customerId,
        jobId:       body.jobId,
        invoiceNumber,
        subtotal,
        discount:    body.discount,
        tax:         body.tax,
        total,
        dueAt:       body.dueAt ? new Date(body.dueAt) : undefined,
        createdById: user.id,
        lines: {
          createMany: {
            data: lines.map((l, i) => ({
              description: l.description,
              quantity:    l.quantity,
              unitPrice:   l.unitPrice,
              amount:      l.amount,
              sortOrder:   i,
            })),
          },
        },
      },
      include: { lines: true },
    });

    await writeAuditLog(
      { shopId: user.shopId, userId: user.id,
        action: "INVOICE_CREATED", entity: "Invoice", entityId: created.id,
        metadata: { total, lineCount: lines.length } },
      tx
    );

    return created;
  });

  return NextResponse.json({ invoice }, { status: 201 });
});
