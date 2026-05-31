import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";

const styleSchema = z.object({
  selectionMode: z.enum(["CATALOG", "UPLOAD", "IMPRESS_ME"]),
  catalogItemId: z.string().optional().nullable(),
  uploadedImageUrl: z.string().optional().nullable(),
  uploadedImagePath: z.string().optional().nullable(),
  materialNotes: z.string().optional().nullable(),
});

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.read" }, async ({ request, user }) => {
    const { id } = await context.params;
    const job = await db.job.findFirst({ where: { id, shopId: user.shopId! }, select: { id: true } });
    if (!job) throw new ApiError("Job not found.", 404);

    const tasks = await db.jobTask.findMany({
      where: { jobId: id },
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
    });

    return NextResponse.json({ tasks });
  })(request);
}

export function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.write" }, async ({ request, user }) => {
    const { id } = await context.params;
    const payload = styleSchema.parse(await request.json());

    const job = await db.job.findFirst({ where: { id, shopId: user.shopId! }, select: { id: true } });
    if (!job) throw new ApiError("Job not found.", 404);

    const tasks = await db.jobTask.findMany({ where: { jobId: id } });
    if (tasks.length === 0) throw new ApiError("No tasks found for this job.", 404);

    const updatedTasks = await Promise.all(
      tasks.map(task =>
        db.jobTask.update({
          where: { id: task.id },
          data: {
            selectionMode: payload.selectionMode as any,
            catalogItemId: payload.catalogItemId ?? null,
            uploadedImageUrl: payload.uploadedImageUrl ?? null,
            uploadedImagePath: payload.uploadedImagePath ?? null,
            materialNotes: payload.materialNotes ?? null,
          },
        })
      )
    );

    return NextResponse.json({ tasks: updatedTasks });
  })(request);
}
