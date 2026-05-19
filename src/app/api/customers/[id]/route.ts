import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

export function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth({ permission: "customers.read" }, async ({ user }) => {
    const { id } = await context.params;
    const customer = await db.customer.findFirst({
      where: { id, shopId: user.shopId! },
      include: {
        measurements: { orderBy: { recordedAt: "desc" } },
        jobs: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { sentAt: "desc" } },
        measurementLinks: {
          where: { expiresAt: { gt: new Date() }, usedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    if (!customer) throw new ApiError("Customer not found.", 404);
    return NextResponse.json({ customer });
  })(request);
}

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  preferredFit: z.string().optional().nullable(),
  preferredStyle: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth({ permission: "customers.write" }, async ({ user }) => {
    const { id } = await context.params;
    const body = updateCustomerSchema.parse(await request.json());

    const existing = await db.customer.findFirst({
      where: { id, shopId: user.shopId! },
      select: { id: true },
    });
    if (!existing) throw new ApiError("Customer not found.", 404);

    const customer = await db.customer.update({
      where: { id },
      data: body,
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "CUSTOMER_UPDATED",
      entity: "Customer",
      entityId: id,
    });

    return NextResponse.json({ customer });
  })(request);
}
