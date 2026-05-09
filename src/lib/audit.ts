import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  shopId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput) {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? undefined;
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();

  await db.auditLog.create({
    data: {
      shopId: input.shopId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
      userAgent,
      ipAddress,
    },
  });
}
