import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { messageTemplate } from "@/lib/email-templates";

const createMessageSchema = z.object({
  customerId: z.string().min(1),
  channel: z.enum(["APP", "EMAIL", "WHATSAPP", "SMS"]),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export const GET = withAuth({ permission: "customers.read" }, async ({ user }) => {
  const messages = await db.customerMessage.findMany({
    where: { shopId: user.shopId! },
    include: { customer: true },
    orderBy: { sentAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ messages });
});

export const POST = withAuth({ permission: "customers.write" }, async ({ request, user }) => {
  const body = createMessageSchema.parse(await request.json());

  const customer = await db.customer.findFirst({
    where: { id: body.customerId, shopId: user.shopId! },
  });
  if (!customer) throw new ApiError("Customer not found.", 404);

  if (body.channel === "EMAIL") {
    if (!customer.email) throw new ApiError("Customer has no email address on file.", 400);

    const shop = await db.shop.findUnique({
      where: { id: user.shopId! },
      select: { name: true },
    });

    await sendEmail({
      to: customer.email,
      subject: body.subject ?? "Message from your tailor",
      html: messageTemplate({
        customerName: `${customer.firstName} ${customer.lastName}`,
        subject: body.subject ?? "Message from your tailor",
        body: body.message,
        shopName: shop?.name ?? "Your Tailor",
      }),
    });
  }

  const created = await db.customerMessage.create({
    data: {
      shopId: user.shopId!,
      customerId: body.customerId,
      channel: body.channel,
      subject: body.subject,
      message: body.message,
      sentBy: user.id,
    },
  });

  await writeAuditLog({
    shopId: user.shopId,
    userId: user.id,
    action: "CUSTOMER_MESSAGE_SENT",
    entity: "CustomerMessage",
    entityId: created.id,
    metadata: { channel: body.channel },
  });

  return NextResponse.json({ message: created }, { status: 201 });
});
