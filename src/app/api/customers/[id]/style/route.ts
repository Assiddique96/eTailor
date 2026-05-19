import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, ApiError } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { deleteFromImageKit } from "@/lib/imagekit";

const schema = z.discriminatedUnion("selectionMode", [
  z.object({
    selectionMode: z.literal("CATALOG"),
    catalogItemId: z.string().min(1),
    notes:         z.string().max(500).optional(),
  }),
  z.object({
    selectionMode:    z.literal("UPLOAD"),
    uploadedImageUrl:  z.string().url(),
    uploadedImagePath: z.string().min(1),
    notes:             z.string().max(500).optional(),
  }),
  z.object({
    selectionMode: z.literal("IMPRESS_ME"),
    notes:         z.string().max(500).optional(),
  }),
]);

export function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "customers.write" }, async ({ request, user }) => {
    const { id: customerId } = await ctx.params;

    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId! },
      select: { id: true },
    });
    if (!customer) throw new ApiError("Customer not found.", 404);

    const body = schema.parse(await request.json());

    // If replacing an uploaded image, delete the old one from ImageKit
    const existing = await db.customerStyleProfile.findUnique({ where: { customerId } });
    if (existing?.uploadedImagePath && body.selectionMode !== "UPLOAD") {
      deleteFromImageKit(existing.uploadedImagePath).catch(console.warn);
    }

    const profile = await db.customerStyleProfile.upsert({
      where: { customerId },
      update: {
        selectionMode:     body.selectionMode,
        catalogItemId:     body.selectionMode === "CATALOG"  ? body.catalogItemId  : null,
        uploadedImageUrl:  body.selectionMode === "UPLOAD"   ? body.uploadedImageUrl  : null,
        uploadedImagePath: body.selectionMode === "UPLOAD"   ? body.uploadedImagePath : null,
        notes:             body.notes ?? null,
      },
      create: {
        customerId,
        selectionMode:     body.selectionMode,
        catalogItemId:     body.selectionMode === "CATALOG" ? body.catalogItemId : null,
        uploadedImageUrl:  body.selectionMode === "UPLOAD"  ? body.uploadedImageUrl  : null,
        uploadedImagePath: body.selectionMode === "UPLOAD"  ? body.uploadedImagePath : null,
        notes:             body.notes ?? null,
      },
    });

    await writeAuditLog({ shopId: user.shopId, userId: user.id,
      action: "CUSTOMER_STYLE_UPDATED", entity: "CustomerStyleProfile", entityId: profile.id,
      metadata: { selectionMode: body.selectionMode, customerId } });

    return NextResponse.json({ profile });
  })(req);
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withAuth({ permission: "customers.read" }, async ({ user }) => {
    const { id: customerId } = await ctx.params;
    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId! },
      select: { id: true },
    });
    if (!customer) throw new ApiError("Customer not found.", 404);

    const profile = await db.customerStyleProfile.findUnique({
      where: { customerId },
      include: { catalogItem: { include: { category: true } } },
    });
    return NextResponse.json({ profile });
  })(req);
}
