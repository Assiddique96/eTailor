import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { ALL_FIELD_NAMES } from "@/lib/measurement-fields";
import { Prisma } from "@/generated/prisma/client";

/** GET — validate a token and return customer + gender context (public, no auth) */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  const link = await db.measurementLink.findUnique({
    where: { token },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      shop: { select: { name: true } },
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }
  if (link.usedAt) {
    return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
  }
  if (link.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 410 });
  }

  return NextResponse.json({
    customer: link.customer,
    shopName: link.shop.name,
    gender: link.gender,
    expiresAt: link.expiresAt,
  });
}

const customFieldSchema = z.object({
  label:   z.string().min(1).max(60),
  valueCm: z.number().nonnegative(),
});

const measurementSchema = z.object({
  ...Object.fromEntries(
    ALL_FIELD_NAMES.map((name) => [name, z.number().nonnegative().optional()])
  ),
  customFields: z.array(customFieldSchema).max(20).optional(),
});

/** POST — submit measurements from the public form; marks link as used */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  const link = await db.measurementLink.findUnique({
    where: { token },
    include: { customer: { select: { id: true, shopId: true } } },
  });

  if (!link) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }
  if (link.usedAt) {
    return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
  }
  if (link.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 410 });
  }

  const body = measurementSchema.parse(await request.json());

  // Separate custom fields from standard measurement fields
  const { customFields, ...standardFields } = body;

  // Filter standard fields to only those with a value
  const measurementData = Object.fromEntries(
    Object.entries(standardFields).filter(([, v]) => v !== undefined && (v as number) > 0)
  );

  const extraJson =
    customFields && customFields.length > 0
      ? { customFields }
      : undefined;

  const [measurement] = await db.$transaction([
    db.measurementRecord.create({
      data: {
        ...(measurementData as Prisma.MeasurementRecordUncheckedCreateInput),
        customerId: link.customerId, // ← after the spread so it wins
        extraJson: extraJson ?? Prisma.JsonNull,
        recordedBy: "remote-link",
      },
    }),
    // Mark link as used so it can't be submitted again
    db.measurementLink.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  // Notify shop staff that remote measurements have been submitted
  createNotification({
    shopId:     link.shopId,
    type:       "MEASUREMENT_IN",
    title:      "Remote measurements received",
    body:       "A customer submitted their measurements via remote link.",
    entityId:   link.customerId,
    entityType: "Customer",
  }).catch(console.warn);

  return NextResponse.json({ measurement }, { status: 201 });
}
