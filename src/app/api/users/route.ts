import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleIds: z.array(z.string().min(1)).min(1),
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

    const users = await db.user.findMany({
      where: { shopId: user.shopId },
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        platformRole: u.platformRole,
        isActive: u.isActive,
        roles: u.userRoles.map((ur) => ur.role.name),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireUser();
    if (!admin.shopId) {
      return NextResponse.json({ error: "Shop context required." }, { status: 400 });
    }
    if (!hasPermission(admin, "users.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = createUserSchema.parse(await request.json());
    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const roleCount = await db.role.count({
      where: { id: { in: body.roleIds }, shopId: admin.shopId },
    });
    if (roleCount !== body.roleIds.length) {
      return NextResponse.json({ error: "Invalid role selection." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const created = await db.user.create({
      data: {
        shopId: admin.shopId,
        fullName: body.fullName,
        email: body.email,
        passwordHash,
        platformRole: "EMPLOYEE",
        userRoles: {
          createMany: {
            data: body.roleIds.map((roleId) => ({ roleId })),
          },
        },
      },
    });

    await writeAuditLog({
      shopId: admin.shopId,
      userId: admin.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: created.id,
      metadata: { roleIds: body.roleIds },
    });

    return NextResponse.json({ message: "Employee account created.", id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
