import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";

const schema = z.object({ body: z.string().min(1).max(2000) });

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.read" }, async ({ user }) => {
    const { id: jobId } = await ctx.params;
    const job = await db.job.findFirst({ where: { id: jobId, shopId: user.shopId! } });
    if (!job) throw new ApiError("Job not found.", 404);
    const comments = await db.jobComment.findMany({
      where:   { jobId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ comments });
  })(req);
}

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.write" }, async ({ request, user }) => {
    const { id: jobId } = await ctx.params;
    const job = await db.job.findFirst({
      where: { id: jobId, shopId: user.shopId! },
      include: { assignedTo: { select: { id: true } }, createdBy: { select: { id: true } } },
    });
    if (!job) throw new ApiError("Job not found.", 404);

    const { body } = schema.parse(await request.json());
    const comment = await db.jobComment.create({
      data: { jobId, userId: user.id, body },
      include: { user: { select: { id: true, fullName: true } } },
    });

    // Notify the assigned staff member (if different from commenter)
    const notifyUserId = job.assignedToId !== user.id
      ? job.assignedToId
      : job.createdById !== user.id
      ? job.createdById
      : null;

    if (notifyUserId) {
      await createNotification({
        shopId:     user.shopId!,
        userId:     notifyUserId,
        type:       "JOB_COMMENT",
        title:      "New comment on a job",
        body:       `${user.fullName} commented on "${job.title}": ${body.slice(0, 80)}${body.length > 80 ? "…" : ""}`,
        entityId:   jobId,
        entityType: "Job",
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  })(req);
}
