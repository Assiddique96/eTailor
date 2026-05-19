import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { runReminderDispatch } from "@/lib/reminders";

/** POST — manual trigger from the dashboard (requires auth) */
export const POST = withAuth({}, async ({ user }) => {
  const result = await runReminderDispatch(user.shopId!);
  return NextResponse.json(result);
});

/** GET — called by Vercel Cron (secured by CRON_SECRET header, not session auth) */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const result = await runReminderDispatch();
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: "Failed to run reminders." }, { status: 500 });
  }
}
