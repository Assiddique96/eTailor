import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  preferredFit: z.string().optional().nullable(),
  preferredStyle: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "customers.read"))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = 50;

    const customers = await db.customer.findMany({
      where: {
        shopId: user.shopId,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId)
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    if (!hasPermission(user, "customers.write"))
      return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });

    const body = createCustomerSchema.parse(await request.json());

    const customer = await db.customer.create({
      data: { ...body, shopId: user.shopId },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "CUSTOMER_CREATED",
      entity: "Customer",
      entityId: customer.id,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
}