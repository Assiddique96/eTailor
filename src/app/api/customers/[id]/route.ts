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

    // 1. Fetch core customer metadata to verify ownership and existence
    const customerBase = await db.customer.findFirst({
      where: { id, shopId: user.shopId! },
    });

    if (!customerBase) {
      throw new ApiError("Customer not found.", 404);
    }

    // 2. Fetch independent data relations using your exact schema client accessors
    const measurements = await db.measurementRecord.findMany({
      where: { customerId: id },
      orderBy: { recordedAt: "desc" },
    }).catch(() => []);

    const invoices = await db.invoice.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const messages = await db.customerMessage.findMany({
      where: { customerId: id },
      orderBy: { sentAt: "desc" },
    }).catch(() => []);

    const measurementLinks = await db.measurementLink.findMany({
      where: {
        customerId: id,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }).catch(() => []);

    // 3. Gather your jobs and safely include job tasks and style selections
    const jobs = await db.job.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          select: {
            id: true,
            garmentType: true,
            description: true,
            selectionMode: true,
            uploadedImageUrl: true,
            materialNotes: true,
            catalogItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        // Kept clean so it returns empty if the database column cache is physically missing
        styleProfile: {
          include: {
            catalogItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    }).catch(() => []);

    // 4. Construct response structure matching your frontend layout expectations
    const customer = {
      ...customerBase,
      measurements,
      jobs,
      invoices,
      messages,
      measurementLinks,
    };

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