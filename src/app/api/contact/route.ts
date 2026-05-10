import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  shopName: z.string().optional(),
  topic: z.string().min(1),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = contactSchema.parse(await request.json());

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1c1917;">
        <h2 style="color:#4f46e5;">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#a8a29e;width:120px;">Name</td><td style="padding:6px 0;font-weight:500;">${body.firstName} ${body.lastName}</td></tr>
          <tr><td style="padding:6px 0;color:#a8a29e;">Email</td><td style="padding:6px 0;"><a href="mailto:${body.email}" style="color:#4f46e5;">${body.email}</a></td></tr>
          ${body.shopName ? `<tr><td style="padding:6px 0;color:#a8a29e;">Shop</td><td style="padding:6px 0;">${body.shopName}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#a8a29e;">Topic</td><td style="padding:6px 0;">${body.topic}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0;" />
        <p style="color:#57534e;line-height:1.6;">${body.message}</p>
      </div>
    `;

    await sendEmail({
      to: process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? "hello@etailor.com",
      subject: `[Contact] ${body.topic} — ${body.firstName} ${body.lastName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please fill in all required fields correctly." }, { status: 400 });
    }
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
