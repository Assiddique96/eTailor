import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

const schema = z.object({
  categoryId:  z.string().min(1),
  name:        z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  imageUrl:    z.string().url(),
  imagePath:   z.string().min(1),
  // fileId removed — not a DB column
  tags:        z.array(z.string()).default([]),
  gender:      z.array(z.enum(["MALE","FEMALE","OTHER"])).default([]),
  sortOrder:   z.number().int().default(0),
});

export const GET = withAuth({ permission: "customers.read" }, async ({ request, user }) => {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const items = await db.catalogItem.findMany({
    where: {
      shopId: user.shopId!,
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(searchParams.get("gender")
        ? { gender: { has: searchParams.get("gender") as never } }
        : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ items });
});

export const POST = withAuth({ permission: "settings.manage" }, async ({ request, user }) => {
  const body = schema.parse(await request.json());

  const cat = await db.catalogCategory.findFirst({
    where: { id: body.categoryId, shopId: user.shopId! },
  });
  if (!cat) throw new ApiError("Category not found.", 404);

  const item = await db.catalogItem.create({
    data: { ...body, shopId: user.shopId! },
    include: { category: { select: { id: true, name: true } } },
  });

  await writeAuditLog({
    shopId: user.shopId, userId: user.id,
    action: "CATALOG_ITEM_CREATED", entity: "CatalogItem", entityId: item.id,
    metadata: { name: item.name, category: cat.name },
  });

  return NextResponse.json({ item }, { status: 201 });
});