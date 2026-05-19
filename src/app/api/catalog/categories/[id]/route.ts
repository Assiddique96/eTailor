import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { deleteFromImageKit } from "@/lib/imagekit";

const schema = z.object({
  name:        z.string().min(1).max(60).optional(),
  description: z.string().max(200).optional(),
  sortOrder:   z.number().int().optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "settings.manage" }, async ({ request, user }) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const cat = await db.catalogCategory.findFirst({ where: { id, shopId: user.shopId! } });
    if (!cat) throw new ApiError("Category not found.", 404);
    const updated = await db.catalogCategory.update({ where: { id }, data: body });
    return NextResponse.json({ category: updated });
  })(req);
}

export function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "settings.manage" }, async ({ user }) => {
    const { id } = await ctx.params;
    const cat = await db.catalogCategory.findFirst({
      where: { id, shopId: user.shopId! },
      include: { items: { select: { imagePath: true } } },
    });
    if (!cat) throw new ApiError("Category not found.", 404);

    // Delete all ImageKit files for items in this category
    await Promise.allSettled(
      (cat as typeof cat & { items: { fileId: string }[] }).items.map((i: { fileId: string }) => deleteFromImageKit(i.fileId))
    );

    await db.catalogCategory.delete({ where: { id } });
    await writeAuditLog({ shopId: user.shopId, userId: user.id,
      action: "CATALOG_CATEGORY_DELETED", entity: "CatalogCategory", entityId: id });
    return NextResponse.json({ ok: true });
  })(req);
}
