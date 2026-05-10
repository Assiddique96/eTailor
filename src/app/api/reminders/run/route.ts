import { NextResponse } from "next/server";
import { runReminderDispatch } from "@/lib/reminders";
import { requireUser } from "@/lib/auth";

// POST — manual trigger from the dashboard (requires auth)
export async function POST() {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });

    const result = await runReminderDispatch(user.shopId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to run reminders." }, { status: 500 });
  }
}

// GET — called by Vercel Cron (secured by CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Run for ALL shops when triggered by cron
    const result = await runReminderDispatch();
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: "Failed to run reminders." }, { status: 500 });
  }
}
