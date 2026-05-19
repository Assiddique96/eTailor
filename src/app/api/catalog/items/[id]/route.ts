import { NextResponse } from "next/server";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { deleteFromImageKit } from "@/lib/imagekit";

export function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "settings.manage" }, async ({ user }) => {
    const { id } = await ctx.params;
    const item = await db.catalogItem.findFirst({ where: { id, shopId: user.shopId! } });
    if (!item) throw new ApiError("Item not found.", 404);

    // Clear any customer style profiles pointing at this item
    await db.customerStyleProfile.updateMany({
      where: { catalogItemId: id },
      data: { catalogItemId: null, selectionMode: null },
    });

    await db.catalogItem.delete({ where: { id } });
    // Delete image from ImageKit (fire-and-forget)
    deleteFromImageKit(item.imagePath).catch(console.warn);

    await writeAuditLog({ shopId: user.shopId, userId: user.id,
      action: "CATALOG_ITEM_DELETED", entity: "CatalogItem", entityId: id });
    return NextResponse.json({ ok: true });
  })(req);
}
