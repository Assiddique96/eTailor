import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createJobSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  assignedToId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "jobs.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const jobs = await db.job.findMany({
      where: { shopId: user.shopId },
      include: {
        customer: true,
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "jobs.write")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = createJobSchema.parse(await request.json());
    const customer = await db.customer.findFirst({
      where: { id: body.customerId, shopId: user.shopId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const job = await db.job.create({
      data: {
        shopId: user.shopId,
        customerId: body.customerId,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate,
        createdById: user.id,
        assignedToId: body.assignedToId,
      },
    });

    await db.notification.create({
      data: {
        shopId: user.shopId,
        title: "Job due reminder",
        body: `Job "${job.title}" is due on ${job.dueDate.toDateString()}.`,
        targetDate: job.dueDate,
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "JOB_CREATED",
      entity: "Job",
      entityId: job.id,
      metadata: { dueDate: job.dueDate.toISOString() },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
