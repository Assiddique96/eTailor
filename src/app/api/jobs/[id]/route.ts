import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";

const updateSchema = z.object({
  status: z.enum(["PENDING","IN_PROGRESS","READY_FOR_FITTING","COMPLETED","DELIVERED","CANCELLED"]).optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.write" }, async ({ request: req, user }) => {
    const { id } = await context.params;
    const body = updateSchema.parse(await req.json());

    const existing = await db.job.findFirst({ where: { id, shopId: user.shopId! }, select: { id: true, title: true, status: true } });
    if (!existing) throw new ApiError("Job not found.", 404);

    const job = await db.job.update({ where: { id }, data: body });

    await writeAuditLog({
      shopId: user.shopId, userId: user.id,
      action: "JOB_UPDATED", entity: "Job", entityId: job.id,
      metadata: body as unknown as InputJsonValue,
    });

    if (body.status && body.status !== existing.status) {
      const STATUS_LABELS: Record<string, string> = {
        PENDING: "Pending", IN_PROGRESS: "In Progress",
        READY_FOR_FITTING: "Ready for Fitting", COMPLETED: "Completed",
        DELIVERED: "Delivered", CANCELLED: "Cancelled",
      };
      createNotification({
        shopId:     user.shopId!,
        type:       "JOB_STATUS_CHANGE",
        title:      "Job status updated",
        body:       `"${existing.title}" moved to ${STATUS_LABELS[body.status] ?? body.status}.`,
        entityId:   job.id,
        entityType: "Job",
      }).catch(console.warn);
    }

    return NextResponse.json({ job });
  })(request);
}
