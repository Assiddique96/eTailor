import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { db } from "@/lib/db";

const schema = z.object({
  name:           z.string().min(1),
  colour:         z.string().optional(),
  quantityMetres: z.number().nonnegative().optional(),
  unitCost:       z.number().nonnegative().optional(),
  supplier:       z.string().optional(),
  notes:          z.string().optional(),
});

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.write" }, async ({ request, user }) => {
    const { id: jobId } = await ctx.params;
    const job = await db.job.findFirst({ where: { id: jobId, shopId: user.shopId! } });
    if (!job) throw new ApiError("Job not found.", 404);

    const body = schema.parse(await request.json());
    const totalCost =
      body.quantityMetres != null && body.unitCost != null
        ? body.quantityMetres * body.unitCost
        : undefined;

    const material = await db.jobMaterial.create({
      data: { jobId, ...body, totalCost },
    });
    return NextResponse.json({ material }, { status: 201 });
  })(req);
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "jobs.read" }, async ({ user }) => {
    const { id: jobId } = await ctx.params;
    const job = await db.job.findFirst({ where: { id: jobId, shopId: user.shopId! } });
    if (!job) throw new ApiError("Job not found.", 404);
    const materials = await db.jobMaterial.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ materials });
  })(req);
}
