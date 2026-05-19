import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";

const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.enum(PERMISSIONS)).min(1),
});

export const GET = withAuth({ permission: "users.manage" }, async ({ user }) => {
  const roles = await db.role.findMany({
    where: { shopId: user.shopId! },
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ roles });
});

export const POST = withAuth({ permission: "users.manage" }, async ({ request, user }) => {
  const body = createRoleSchema.parse(await request.json());

  const perms = await db.permission.findMany({
    where: { key: { in: body.permissions as unknown as string[] } },
    select: { id: true },
  });

  const role = await db.role.create({
    data: {
      shopId: user.shopId!,
      name: body.name,
      description: body.description,
      permissions: {
        createMany: { data: perms.map((p) => ({ permissionId: p.id })) },
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
});
