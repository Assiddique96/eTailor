import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const customFieldSchema = z.object({
  label: z.string().min(1).max(60),
  valueCm: z.number().nonnegative(),
});

const addMeasurementSchema = z.object({
  customerId:   z.string().min(1),
  chestCm:      z.number().nonnegative().optional(),
  waistCm:      z.number().nonnegative().optional(),
  hipCm:        z.number().nonnegative().optional(),
  shoulderCm:   z.number().nonnegative().optional(),
  sleeveCm:     z.number().nonnegative().optional(),
  neckCm:       z.number().nonnegative().optional(),
  inseamCm:     z.number().nonnegative().optional(),
  outseamCm:    z.number().nonnegative().optional(),
  comment:      z.string().max(500).optional(),
  // Custom fields go into extraJson as an array of {label, valueCm} objects
  customFields: z.array(customFieldSchema).max(20).optional(),
});

export const POST = withAuth({ permission: "measurements.write" }, async ({ request, user }) => {
  const body = addMeasurementSchema.parse(await request.json());

  const customer = await db.customer.findFirst({
    where: { id: body.customerId, shopId: user.shopId! },
    select: { id: true },
  });
  if (!customer) throw new ApiError("Customer not found.", 404);

  // Merge custom fields and comment into extraJson
  const extraJson: Prisma.InputJsonValue | undefined =
    (body.customFields && body.customFields.length > 0) || body.comment
      ? {
          ...(body.customFields && body.customFields.length > 0 ? { customFields: body.customFields } : {}),
          ...(body.comment ? { comment: body.comment } : {}),
        }
      : undefined;

  const measurement = await db.measurementRecord.create({
    data: {
      customerId: body.customerId,
      chestCm:    body.chestCm,
      waistCm:    body.waistCm,
      hipCm:      body.hipCm,
      shoulderCm: body.shoulderCm,
      sleeveCm:   body.sleeveCm,
      neckCm:     body.neckCm,
      inseamCm:   body.inseamCm,
      outseamCm:  body.outseamCm,
      extraJson,
      recordedBy: user.id,
    },
  });

  await writeAuditLog({
    shopId:   user.shopId,
    userId:   user.id,
    action:   "MEASUREMENT_ADDED",
    entity:   "MeasurementRecord",
    entityId: measurement.id,
  });

  return NextResponse.json({ measurement }, { status: 201 });
});
