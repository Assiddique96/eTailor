import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";
import { messageTemplate } from "@/lib/email-templates";

const createMessageSchema = z.object({
  customerId: z.string().min(1),
  channel: z.enum(["APP", "EMAIL", "WHATSAPP", "SMS"]),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "customers.read")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const messages = await db.customerMessage.findMany({
      where: { shopId: user.shopId },
      include: { customer: true },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "customers.write")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = createMessageSchema.parse(await request.json());

    const customer = await db.customer.findFirst({
      where: { id: body.customerId, shopId: user.shopId },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const shop = await db.shop.findUnique({
      where: { id: user.shopId },
      select: { name: true },
    });

    // Send real email if channel is EMAIL
    if (body.channel === "EMAIL") {
      if (!customer.email) {
        return NextResponse.json(
          { error: "Customer has no email address on file." },
          { status: 400 }
        );
      }
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
        shopId: user.shopId,
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
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message.includes("email")) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
