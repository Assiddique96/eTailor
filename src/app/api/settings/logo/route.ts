import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { deleteFromImageKit } from "@/lib/imagekit";

const schema = z.object({
  logoUrl:  z.string().url(),
  filePath: z.string().min(1),
  fileId:   z.string().min(1),
});

function extractFileId(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  try { return new URL(logoUrl).searchParams.get("fileId"); } catch { return null; }
}

export const PUT = withAuth({ permission: "settings.manage" }, async ({ request, user }) => {
  const body = schema.parse(await request.json());

  const existing = await db.shop.findUnique({
    where: { id: user.shopId! },
    select: { logoUrl: true },
  });

  const oldFileId = extractFileId(existing?.logoUrl);
  if (oldFileId) deleteFromImageKit(oldFileId).catch(console.warn);

  // Embed fileId as query param so we can retrieve it for future deletion
  const storedUrl = `${body.logoUrl}?fileId=${body.fileId}`;
  const shop = await db.shop.update({
    where: { id: user.shopId! },
    data: { logoUrl: storedUrl },
  });

  await writeAuditLog({
    shopId: user.shopId, userId: user.id,
    action: "SHOP_LOGO_UPDATED", entity: "Shop", entityId: user.shopId!,
  });

  return NextResponse.json({ logoUrl: shop.logoUrl });
});

export const DELETE = withAuth({ permission: "settings.manage" }, async ({ user }) => {
  const shop = await db.shop.findUnique({
    where: { id: user.shopId! },
    select: { logoUrl: true },
  });

  const fileId = extractFileId(shop?.logoUrl);
  if (fileId) deleteFromImageKit(fileId).catch(console.warn);

  await db.shop.update({ where: { id: user.shopId! }, data: { logoUrl: null } });

  await writeAuditLog({
    shopId: user.shopId, userId: user.id,
    action: "SHOP_LOGO_REMOVED", entity: "Shop", entityId: user.shopId!,
  });

  return NextResponse.json({ ok: true });
});
