import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

function passwordResetTemplate({ fullName, resetUrl }: { fullName: string; resetUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden;">
        <tr><td style="padding:24px 32px;background:#4f46e5;">
          <span style="color:#fff;font-size:18px;font-weight:600;">eTailor</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1c1917;font-size:20px;">Reset your password</h2>
          <p style="color:#57534e;margin:0 0 12px;">Hi <strong>${fullName}</strong>,</p>
          <p style="color:#57534e;margin:0 0 24px;line-height:1.6;">
            We received a request to reset your eTailor password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
            Reset password
          </a>
          <p style="color:#a8a29e;font-size:13px;margin:24px 0 0;line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:20px 0;" />
          <p style="color:#a8a29e;font-size:12px;margin:0;word-break:break-all;">Or copy this link: ${resetUrl}</p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f7f6f3;border-top:1px solid #e7e5e4;">
          <p style="margin:0;font-size:12px;color:#a8a29e;">© ${new Date().getFullYear()} eTailor</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  // 3 requests per IP per 15 minutes — prevent reset-link spam and quota exhaustion
  const ip = getClientIp(request);
  
  // 💡 Add 'await' here to unwrap the promise
  const rl = await checkRateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000); 
  
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });


  // Always return the same response regardless of whether the email exists.
  // This prevents user-enumeration via timing differences or distinct responses.
  const SUCCESS = NextResponse.json({ success: true });
  try {
    const { email } = schema.parse(await request.json());

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return SUCCESS;
    }

    // Invalidate any existing unused tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your eTailor password",
      html: passwordResetTemplate({ fullName: user.fullName, resetUrl }),
    });

    return SUCCESS;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
