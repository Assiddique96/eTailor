/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint — push real-time notifications to the browser.
 * The client connects once; the server pushes events as they happen.
 *
 * Vercel Functions support streaming responses.
 */
import { getCurrentUser } from "@/lib/auth";
import { subscribeShop, unsubscribeShop } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.shopId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const shopId = user.shopId;
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      subscribeShop(shopId, ctrl);

      // Send a heartbeat immediately so the browser knows the connection is live
      const encoder = new TextEncoder();
      ctrl.enqueue(encoder.encode(": heartbeat\n\n"));
    },
    cancel() {
      unsubscribeShop(shopId, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering on Vercel
    },
  });
}
