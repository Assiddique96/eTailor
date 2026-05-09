import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runReminderDispatch } from "@/lib/reminders";

export async function POST() {
  try {
    const user = await requireUser();
    if (user.platformRole === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const result = await runReminderDispatch(user.platformRole === "SUPER_ADMIN" ? undefined : user.shopId ?? undefined);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Failed to run reminders." }, { status: 500 });
  }
}
