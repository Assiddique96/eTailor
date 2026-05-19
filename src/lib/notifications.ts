/**
 * Notification creation utility.
 * Writes to the Notification table and broadcasts via SSE to connected clients.
 *
 * Notification types:
 *   JOB_COMMENT       — a comment was added to a job the user is involved with
 *   MEASUREMENT_IN     — a remote measurement link was submitted
 *   JOB_STATUS_CHANGE  — a job's status changed
 *   PAYMENT_RECEIVED   — a payment was recorded against an invoice
 *   REMINDER_SENT      — the automated reminder ran
 *   INFO               — generic informational
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
  shopId:     string;
  userId?:    string | null;  // null = broadcast to whole shop
  type:       NotificationType;
  title:      string;
  body:       string;
  entityId?:  string;
  entityType?: string;
};

// In-process SSE subscriber registry
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
  const encoder = new TextEncoder();
  for (const ctrl of [...conns]) {
    try {
      ctrl.enqueue(encoder.encode(data));
    } catch {
      conns.delete(ctrl); // stale connection
    }
  }
}

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

  // Broadcast to all connected clients in this shop
  broadcast(input.shopId, { type: "notification", notification });

  return notification;
}
