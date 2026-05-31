import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const createCustomerSchema = z.object({
  firstName:      z.string().min(1, "First name is required"),
  lastName:       z.string().min(1, "Last name is required"),
  gender:         z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  phone:          z.string().optional().nullable(),
  email:          z.string().email().optional().nullable(),
  preferredFit:   z.string().optional().nullable(),
  preferredStyle: z.string().optional().nullable(),
  notes:          z.string().optional().nullable(),
});

export const GET = withAuth({ permission: "customers.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const q      = searchParams.get("q")?.trim();
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = 50;

  const where = {
    shopId: user.shopId!,
    ...(q ? {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName:  { contains: q, mode: "insensitive" as const } },
        { phone:     { contains: q, mode: "insensitive" as const } },
        { email:     { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const items = await db.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take:    limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      // Counts for the list view
      _count: { select: { jobs: true, invoices: true } },
      // Latest job date
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const hasMore    = items.length > limit;
  const customers  = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? customers[customers.length - 1].id : null;

  const total = !cursor
    ? await db.customer.count({ where })
    : null;

  return NextResponse.json({ customers, nextCursor, total });
});

export const POST = withAuth({ permission: "customers.write" }, async ({ request, user }) => {
  const body = createCustomerSchema.parse(await request.json());

  const customer = await db.customer.create({
    data: { ...body, shopId: user.shopId! },
  });

  await writeAuditLog({
    shopId:   user.shopId,
    userId:   user.id,
    action:   "CUSTOMER_CREATED",
    entity:   "Customer",
    entityId: customer.id,
  });

  return NextResponse.json({ customer }, { status: 201 });
});
