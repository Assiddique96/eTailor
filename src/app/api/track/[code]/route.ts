import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const trackingCode = code.toUpperCase().trim();

    const job = await db.job.findUnique({
      where: { trackingCode },
      include: {
        shop: { select: { name: true, phone: true, email: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "No order found with this tracking code." }, { status: 404 });
    }

    // Return only safe, non-sensitive fields
    return NextResponse.json({
      job: {
        trackingCode: job.trackingCode,
        title: job.title,
        description: job.description,
        status: job.status,
        priority: job.priority,
        dueDate: job.dueDate,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        shop: job.shop,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}
