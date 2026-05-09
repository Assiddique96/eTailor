import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
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
