import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser, revokeSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("etailor_session")?.value;

  // Revoke the session server-side before clearing the cookie
  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const verified = await jwtVerify(token, encoder.encode(secret));
        const jti = verified.payload.jti as string | undefined;
        if (jti) await revokeSession({ jti });
      }
    } catch {
      // Token already expired or invalid — revocation is a no-op
    }
  }

  const user = await getCurrentUser();
  await clearSessionCookie();

  if (user) {
    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "LOGOUT",
      entity: "User",
      entityId: user.id,
    });
  }

  return NextResponse.json({ message: "Logged out successfully." });
}
