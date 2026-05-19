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

/**
 * Writes an audit log entry.
 *
 * Pass `tx` to include the write in the same Prisma transaction as the primary
 * operation — this guarantees atomicity: either both succeed or both roll back.
 *
 * Without `tx`, the write is fire-and-forget in a detached microtask so it
 * never adds latency to the response, but a failure is only logged, not surfaced.
 *
 * Prefer passing `tx` for all write operations. Reserve the background mode
 * for read-only audit events (e.g. report exports, PDF downloads).
 *
 * Usage — atomic (inside a route handler using db.$transaction):
 *   const result = await db.$transaction(async (tx) => {
 *     const entity = await tx.someModel.create({ ... });
 *     await writeAuditLog({ ..., entityId: entity.id }, tx);
 *     return entity;
 *   });
 *
 * Usage — background (fire-and-forget):
 *   await writeAuditLog({ action: "INVOICE_DOWNLOADED", ... });
 */
export async function writeAuditLog(
  input: AuditInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? db;

  async function buildAndWrite() {
    let userAgent: string | undefined;
    let ipAddress: string | undefined;

    try {
      const headerStore = await headers();
      userAgent = headerStore.get("user-agent") ?? undefined;
      const forwarded = headerStore.get("x-forwarded-for");
      ipAddress = forwarded?.split(",")[0]?.trim();
    } catch {
      // headers() throws outside a request context (e.g. scripts, tests)
    }

    await client.auditLog.create({
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

  if (tx) {
    // Atomic — runs inside the caller's transaction, errors propagate
    await buildAndWrite();
  } else {
    // Background — detached microtask; failure is logged but never surfaces to the user
    buildAndWrite().catch((err) =>
      console.error("[AuditLog] Background write failed:", err)
    );
  }
}
