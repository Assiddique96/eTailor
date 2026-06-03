import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { generateTrackingCode } from "@/lib/tracking";

const createJobSchema = z.object({
  customerId:    z.string().min(1),
  title:         z.string().min(1),
  description:   z.string().optional(),
  dueDate:       z.coerce.date(),
  totalPrice:    z.number().nonnegative().optional(),
  assignedToId:  z.string().optional(),
  priority:      z.number().int().min(1).max(5).default(3),
  depositAmount: z.number().nonnegative().optional(),
  depositPaid:   z.boolean().default(false),
  tasks:         z.array(z.object({
    garmentType:   z.string().min(1),
    description:   z.string().optional(),
    quantity:      z.number().int().min(1).default(1),
    unitPrice:     z.number().nonnegative().optional(),
    materialNotes: z.string().optional(),
  })).min(1),
});

export const GET = withAuth({ permission: "jobs.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const unbilled = searchParams.get("unbilled");
  const q = searchParams.get("q")?.trim();
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  const where: any = {
    shopId: user.shopId!,
    ...(status ? { status: status as never } : {}),
    ...(customerId ? { customerId } : {}),
  };

  if (unbilled === "true") {
    where.invoice = { is: null };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const items = await db.job.findMany({
    where,
    include: {
      customer:  true,
      assignedTo: { select: { id: true, fullName: true } },
      materials:  true,
      tasks:      true,
      invoice:    true,
      // Include styleProfile in list views if your components need to access it
      styleProfile: {
        include: { catalogItem: true }
      },
      _count:     { select: { comments: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take:    limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore  = items.length > limit;
  const jobs     = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? jobs[jobs.length - 1].id : null;

  return NextResponse.json({ jobs, nextCursor });
});

export const POST = withAuth({ permission: "jobs.write" }, async ({ request, user }) => {
  const body = createJobSchema.parse(await request.json());

  const customer = await db.customer.findFirst({
    where: { id: body.customerId, shopId: user.shopId! },
    select: { id: true },
  });
  if (!customer) throw new ApiError("Customer not found.", 404);

  // ❌ REMOVED: Old lookup call checking for the non-existent customerId relation workspace

  async function tryCreate(code: string): Promise<Awaited<ReturnType<typeof db.job.create>>> {
    try {
      return await db.job.create({
        data: {
          shopId:        user.shopId!,
          customerId:    body.customerId,
          title:         body.title,
          description:   body.description,
          dueDate:       body.dueDate,
          totalPrice:    body.totalPrice ?? null,
          priority:      body.priority,
          createdById:   user.id,
          assignedToId:  body.assignedToId,
          trackingCode:  code,
          depositAmount: body.depositAmount ?? null,
          depositPaidAt: body.depositPaid && body.depositAmount ? new Date() : null,
          tasks: {
            create: body.tasks.map(task => ({
              garmentType:   task.garmentType,
              description:   task.description,
              quantity:      task.quantity,
              unitPrice:     task.unitPrice ?? null,
              materialNotes: task.materialNotes,
            })),
          },
          // --- RELATIONAL FIX: Provision a fresh, empty style profile tied directly to this job's ID ---
          styleProfile: {
            create: {
              selectionMode: "IMPRESS_ME",
              notes: "Initial job creation tracking profile blueprint.",
            },
          },
        },
        include: {
          tasks: true,
          customer: true,
          styleProfile: true, // Returning it ensures full object metadata matches client requirements
        },
      });
    } catch (e: unknown) {
      const isUnique = typeof e === "object" && e !== null && "code" in e
        && (e as { code: string }).code === "P2002";
      if (isUnique) return tryCreate(generateTrackingCode());
      throw e;
    }
  }

  const job = await tryCreate(generateTrackingCode());

  await writeAuditLog({
    shopId:   user.shopId,
    userId:   user.id,
    action:   "JOB_CREATED",
    entity:   "Job",
    entityId: job.id,
    metadata: {
      dueDate:       job.dueDate.toISOString(),
      trackingCode:  job.trackingCode,
      depositAmount: job.depositAmount,
      depositPaid:   !!job.depositPaidAt,
      taskCount:     body.tasks.length,
      totalPrice:    job.totalPrice,
    },
  });

  return NextResponse.json({ job }, { status: 201 });
});