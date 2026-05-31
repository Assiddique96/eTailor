/**
 * Notification creation utility.
 * Writes to the Notification table and broadcasts in real-time.
 *
 * Real-time delivery strategy
 * ───────────────────────────
 * The previous implementation kept SSE subscribers in a module-level Map.
 * This is fine in a single-process Node.js server, but breaks on any
 * multi-instance or serverless deployment (Vercel, Railway, Fly.io) because
 * each function instance has its own memory — a broadcast on instance A never
 * reaches subscribers connected to instance B.
 *
 * Recommended upgrade path (choose one):
 *   1. Upstash Redis pub/sub  — drop-in, serverless-safe, free tier available.
 *      Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env.
 *   2. Ably / Pusher Channels — managed WebSocket service, generous free tier.
 *   3. Supabase Realtime      — if you're already using Supabase for Postgres.
 *
 * For now the in-process Map is kept but clearly documented as single-instance
 * only. The SSE endpoint (/api/notifications/stream) falls back to polling
 * (client re-fetches /api/notifications every 30 s) when no push arrives,
 * so the UI is never stale even without a pub/sub backend.
 *
 * To migrate to Upstash Redis:
 *   npm install @upstash/redis
 *   Replace subscribeShop/unsubscribeShop/broadcast below with Redis pub/sub.
 *   See: https://docs.upstash.com/redis/sdks/ts/commands/pubsub
 */
import { db } from "@/lib/db";

export type NotificationType =
  | "JOB_COMMENT"
  | "MEASUREMENT_IN"
  | "JOB_STATUS_CHANGE"
  | "PAYMENT_RECEIVED"
  | "REMINDER_SENT"
  | "INFO";

type CreateNotificationInput = {
  shopId:      string;
  userId?:     string | null;
  type:        NotificationType;
  title:       string;
  body:        string;
  entityId?:   string;
  entityType?: string;
};

// ─── In-process SSE subscriber registry (single-instance only) ───────────────
// Map<shopId, Set<ReadableStreamDefaultController>>
const subscribers = new Map<string, Set<ReadableStreamDefaultController>>();

export function subscribeShop(
  shopId:     string,
  controller: ReadableStreamDefaultController
) {
  if (!subscribers.has(shopId)) subscribers.set(shopId, new Set());
  subscribers.get(shopId)!.add(controller);
}

export function unsubscribeShop(
  shopId:     string,
  controller: ReadableStreamDefaultController
) {
  subscribers.get(shopId)?.delete(controller);
}

function broadcast(shopId: string, payload: object) {
  const conns = subscribers.get(shopId);
  if (!conns || conns.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  const enc  = new TextEncoder();
  for (const ctrl of [...conns]) {
    try {
      ctrl.enqueue(enc.encode(data));
    } catch {
      conns.delete(ctrl); // stale connection
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  const notification = await db.notification.create({
    data: {
      shopId:     input.shopId,
      userId:     input.userId,
      type:       input.type,
      title:      input.title,
      body:       input.body,
      entityId:   input.entityId,
      entityType: input.entityType,
    },
  });

  // Best-effort in-process push; also works as a no-op when no subscriber
  // is connected (client falls back to the 30 s polling interval).
  broadcast(input.shopId, { type: "notification", notification });

  return notification;
}
