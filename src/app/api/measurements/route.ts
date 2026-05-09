import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const addMeasurementSchema = z.object({
  customerId: z.string().min(1),
  chestCm: z.number().nonnegative().optional(),
  waistCm: z.number().nonnegative().optional(),
  hipCm: z.number().nonnegative().optional(),
  shoulderCm: z.number().nonnegative().optional(),
  sleeveCm: z.number().nonnegative().optional(),
  neckCm: z.number().nonnegative().optional(),
  inseamCm: z.number().nonnegative().optional(),
  outseamCm: z.number().nonnegative().optional(),
  extraJson: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "measurements.write")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = addMeasurementSchema.parse(await request.json());
    const customer = await db.customer.findFirst({
      where: { id: body.customerId, shopId: user.shopId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const measurement = await db.measurementRecord.create({
      data: {
        customerId: body.customerId,
        chestCm: body.chestCm,
        waistCm: body.waistCm,
        hipCm: body.hipCm,
        shoulderCm: body.shoulderCm,
        sleeveCm: body.sleeveCm,
        neckCm: body.neckCm,
        inseamCm: body.inseamCm,
        outseamCm: body.outseamCm,
        extraJson: body.extraJson as Prisma.InputJsonValue | undefined,
        recordedBy: user.id,
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "MEASUREMENT_ADDED",
      entity: "MeasurementRecord",
      entityId: measurement.id,
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add measurement." }, { status: 500 });
  }
}
