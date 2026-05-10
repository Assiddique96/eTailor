import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { generateTrackingCode } from "@/lib/tracking";

const createJobSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  assignedToId: z.string().optional(),
  priority: z.number().int().min(1).max(5).default(3),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "jobs.read"))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 200;

    const jobs = await db.job.findMany({
      where: {
        shopId: user.shopId,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        customer: true,
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "jobs.write"))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = createJobSchema.parse(await request.json());

    const customer = await db.customer.findFirst({
      where: { id: body.customerId, shopId: user.shopId },
      select: { id: true },
    });
    if (!customer)
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    // Generate unique tracking code — retry on collision
    let trackingCode = generateTrackingCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.job.findUnique({ where: { trackingCode } });
      if (!existing) break;
      trackingCode = generateTrackingCode();
      attempts++;
    }

    const job = await db.job.create({
      data: {
        shopId: user.shopId,
        customerId: body.customerId,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate,
        priority: body.priority,
        createdById: user.id,
        assignedToId: body.assignedToId,
        trackingCode,
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "JOB_CREATED",
      entity: "Job",
      entityId: job.id,
      metadata: { dueDate: job.dueDate.toISOString(), trackingCode },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
