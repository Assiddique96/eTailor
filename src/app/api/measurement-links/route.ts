import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { measurementLinkTemplate } from "@/lib/email-templates";
import { db } from "@/lib/db";

const createLinkSchema = z.object({
  customerId:  z.string().min(1),
  gender:      z.enum(["MALE", "FEMALE", "OTHER"]),
  expiryHours: z.number().int().min(1).max(168).default(72),
  sendEmail:   z.boolean().default(false),
});

/** POST — generate a remote measurement link, optionally email it */
export const POST = withAuth({ permission: "measurements.write" }, async ({ request, user }) => {
  const body = createLinkSchema.parse(await request.json());

  const customer = await db.customer.findFirst({
    where: { id: body.customerId, shopId: user.shopId! },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!customer) throw new ApiError("Customer not found.", 404);

  const shop = await db.shop.findUnique({
    where: { id: user.shopId! },
    select: { name: true },
  });

  const expiresAt = new Date(Date.now() + body.expiryHours * 60 * 60 * 1000);

  const link = await db.measurementLink.create({
    data: {
      customerId: body.customerId,
      shopId: user.shopId!,
      gender: body.gender,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/measure/${link.token}`;

  // Optionally email the link to the customer
  if (body.sendEmail && customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `${shop?.name ?? "Your tailor"} needs your measurements`,
      html: measurementLinkTemplate({
        customerName: `${customer.firstName} ${customer.lastName}`,
        shopName: shop?.name ?? "Your Tailor",
        url,
        gender: body.gender,
        expiresAt,
      }),
    });
  }

  await writeAuditLog({
    shopId: user.shopId,
    userId: user.id,
    action: "MEASUREMENT_LINK_CREATED",
    entity: "MeasurementLink",
    entityId: link.id,
    metadata: {
      customerId: body.customerId,
      gender: body.gender,
      expiresAt,
      emailedToCustomer: body.sendEmail && !!customer.email,
    },
  });

  return NextResponse.json({ link, url }, { status: 201 });
});

/** GET — list links for a customer */
export const GET = withAuth({ permission: "measurements.write" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) throw new ApiError("customerId is required.", 400);

  const customer = await db.customer.findFirst({
    where: { id: customerId, shopId: user.shopId! },
    select: { id: true },
  });
  if (!customer) throw new ApiError("Customer not found.", 404);

  const links = await db.measurementLink.findMany({
    where: { customerId, shopId: user.shopId! },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({
    links: links.map((l) => ({
      ...l,
      url: `${baseUrl}/measure/${l.token}`,
      expired: l.expiresAt < new Date(),
      active: !l.usedAt && l.expiresAt > new Date(),
    })),
  });
});
