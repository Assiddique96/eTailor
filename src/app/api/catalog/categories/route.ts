import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const schema = z.object({
  name:        z.string().min(1, "Name is required").max(60),
  description: z.string().max(200).optional(),
  sortOrder:   z.number().int().default(0),
});

export const GET = withAuth({ permission: "settings.manage" }, async ({ user }) => {
  const categories = await db.catalogCategory.findMany({
    where: { shopId: user.shopId! },
    include: { _count: { select: { items: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
});

export const POST = withAuth({ permission: "settings.manage" }, async ({ request, user }) => {
  const body = schema.parse(await request.json());
  const category = await db.catalogCategory.create({
    data: { ...body, shopId: user.shopId! },
  });
  await writeAuditLog({ shopId: user.shopId, userId: user.id,
    action: "CATALOG_CATEGORY_CREATED", entity: "CatalogCategory", entityId: category.id });
  return NextResponse.json({ category }, { status: 201 });
});
