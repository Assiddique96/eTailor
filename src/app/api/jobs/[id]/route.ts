import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "READY_FOR_FITTING", "COMPLETED", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "jobs.write")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const existing = await db.job.findFirst({ where: { id, shopId: user.shopId } });
    if (!existing) return NextResponse.json({ error: "Job not found." }, { status: 404 });

    const job = await db.job.update({
      where: { id },
      data: { status: body.status },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "JOB_STATUS_UPDATED",
      entity: "Job",
      entityId: job.id,
      metadata: { status: body.status },
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update job." }, { status: 500 });
  }
}
