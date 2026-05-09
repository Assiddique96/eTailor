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
  roleId: z.string().optional(),
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
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        platformRole: u.platformRole,
        isActive: u.isActive,
        createdAt: u.createdAt,
        userRoles: u.userRoles.map((ur) => ({ role: { name: ur.role.name } })),
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
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    if (body.roleId) {
      const role = await db.role.findFirst({
        where: { id: body.roleId, shopId: admin.shopId },
      });
      if (!role) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const created = await db.user.create({
      data: {
        shopId: admin.shopId,
        fullName: body.fullName,
        email: body.email,
        passwordHash,
        platformRole: "EMPLOYEE",
        ...(body.roleId
          ? { userRoles: { create: { roleId: body.roleId } } }
          : {}),
      },
    });

    await writeAuditLog({
      shopId: admin.shopId,
      userId: admin.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: created.id,
      metadata: { roleId: body.roleId },
    });

    return NextResponse.json(
      { message: "Employee account created.", id: created.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}