import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const taskUpdateSchema = z.object({
  tasks: z.record(
    z.string(),
    z.object({
      selectionMode: z.enum(["CATALOG", "UPLOAD", "IMPRESS_ME"]).nullable().optional(),
      catalogItem: z
        .object({
          id: z.string(),
          name: z.string(),
          imageUrl: z.string(),
          category: z.object({ name: z.string() }),
        })
        .nullable()
        .optional(),
      uploadedImageUrl: z.string().nullable().optional(),
      materialNotes: z.string().nullable().optional(),
    })
  ),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth({ permission: "jobs.write" }, async ({ request, user }) => {
    const { id: jobId } = await context.params;

    // Verify job exists and belongs to user's shop
    const job = await db.job.findFirst({
      where: { id: jobId, shopId: user.shopId! },
      select: { id: true, title: true },
    });
    if (!job) throw new ApiError("Job not found.", 404);

    const payload = taskUpdateSchema.parse(await request.json());

    // Update each task individually
    const updatedTasks = await Promise.all(
      Object.entries(payload.tasks).map(([taskId, updates]) =>
        db.jobTask.update({
          where: { id: taskId, jobId },
          data: {
            selectionMode: updates.selectionMode ?? undefined,
            catalogItemId: updates.catalogItem?.id ?? null,
            uploadedImageUrl: updates.uploadedImageUrl ?? undefined,
            materialNotes: updates.materialNotes ?? undefined,
          },
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
        })
      )
    );

    // Write audit log
    await writeAuditLog({
      userId: user.id,
      shopId: user.shopId!,
      action: "UPDATE_JOB_TASK_STYLES",
      entity: "job",
      entityId: jobId,
      metadata: {
        taskCount: updatedTasks.length,
        updatedFields: Object.keys(payload.tasks),
      },
    });

    return NextResponse.json({ tasks: updatedTasks });
  })(request);
}
