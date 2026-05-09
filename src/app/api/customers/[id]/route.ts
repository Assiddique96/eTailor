import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "customers.read")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const customer = await db.customer.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        measurements: { orderBy: { recordedAt: "desc" } },
        jobs: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { sentAt: "desc" } },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "Failed to fetch customer." }, { status: 500 });
  }
}
