import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";

const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.enum(PERMISSIONS)).min(1),
});

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "users.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const roles = await db.role.findMany({
      where: { shopId: user.shopId },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ roles });
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(user, "users.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = createRoleSchema.parse(await request.json());
    const perms = await db.permission.findMany({
      where: { key: { in: body.permissions as unknown as string[] } },
      select: { id: true },
    });

    const role = await db.role.create({
      data: {
        shopId: user.shopId,
        name: body.name,
        description: body.description,
        permissions: {
          createMany: {
            data: perms.map((p) => ({ permissionId: p.id })),
          },
        },
      },
    });

    await writeAuditLog({
      shopId: user.shopId,
      userId: user.id,
      action: "ROLE_CREATED",
      entity: "Role",
      entityId: role.id,
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
  }
}
