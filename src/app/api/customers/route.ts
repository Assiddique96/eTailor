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

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }

    // Permission Check
    if (!hasPermission(user, "customers.write")) {
      console.error(`User ${user.id} with role ${user.platformRole} denied access to customers.write`);
      return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
    }

    const json = await request.json();
    const body = createCustomerSchema.parse(json);

    const customer = await db.customer.create({
      data: { 
        ...body, 
        shopId: user.shopId 
      },
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST Customer Error:", error);
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
}

// GET remains the same as your previous snippet