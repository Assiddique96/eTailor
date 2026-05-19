import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleIds: z.array(z.string().min(1)).min(1),
});

export const GET = withAuth({ permission: "users.manage" }, async ({ user }) => {
  const users = await db.user.findMany({
    where: { shopId: user.shopId! },
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
});

export const POST = withAuth({ permission: "users.manage" }, async ({ request, user }) => {
  const body = createUserSchema.parse(await request.json());

  const existing = await db.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ApiError("Email already exists.", 409);

  const roleCount = await db.role.count({
    where: { id: { in: body.roleIds }, shopId: user.shopId! },
  });
  if (roleCount !== body.roleIds.length) throw new ApiError("Invalid role selection.", 400);

  const passwordHash = await bcrypt.hash(body.password, 12);
  const created = await db.user.create({
    data: {
      shopId: user.shopId!,
      fullName: body.fullName,
      email: body.email,
      passwordHash,
      platformRole: "EMPLOYEE",
      userRoles: {
        createMany: { data: body.roleIds.map((roleId) => ({ roleId })) },
      },
    },
  });

  await writeAuditLog({
    shopId: user.shopId,
    userId: user.id,
    action: "USER_CREATED",
    entity: "User",
    entityId: created.id,
    metadata: { roleIds: body.roleIds },
  });

  return NextResponse.json(
    { message: "Employee account created.", id: created.id },
    { status: 201 }
  );
});
