import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { generateTrackingCode } from "@/lib/tracking";

const createJobSchema = z.object({
  customerId:      z.string().min(1),
  title:           z.string().min(1),
  description:     z.string().optional(),
  dueDate:         z.coerce.date(),
  assignedToId:    z.string().optional(),
  priority:        z.number().int().min(1).max(5).default(3),
  depositAmount:   z.number().nonnegative().optional(),
  depositPaid:     z.boolean().default(false),
});

export const GET = withAuth({ permission: "jobs.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  const where = {
    shopId: user.shopId!,
    ...(status ? { status: status as never } : {}),
  };

  const items = await db.job.findMany({
    where,
    include: {
      customer:  true,
      assignedTo: { select: { id: true, fullName: true } },
      materials:  true,
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

  async function tryCreate(code: string): Promise<Awaited<ReturnType<typeof db.job.create>>> {
    try {
      return await db.job.create({
        data: {
          shopId:        user.shopId!,
          customerId:    body.customerId,
          title:         body.title,
          description:   body.description,
          dueDate:       body.dueDate,
          priority:      body.priority,
          createdById:   user.id,
          assignedToId:  body.assignedToId,
          trackingCode:  code,
          depositAmount: body.depositAmount ?? null,
          depositPaidAt: body.depositPaid && body.depositAmount ? new Date() : null,
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
    },
  });

  return NextResponse.json({ job }, { status: 201 });
});
