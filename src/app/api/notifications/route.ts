import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

/** GET — fetch unread + recent notifications for the current user's shop */
export const GET = withAuth({}, async ({ user }) => {
  const notifications = await db.notification.findMany({
    where: {
      shopId: user.shopId!,
      OR: [{ userId: user.id }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
});

/** PATCH — mark one or all notifications as read */
export const PATCH = withAuth({}, async ({ request, user }) => {
  const { id } = await request.json() as { id?: string };
  if (id) {
    await db.notification.updateMany({
      where: { id, shopId: user.shopId! },
      data:  { isRead: true, readAt: new Date() },
    });
  } else {
    await db.notification.updateMany({
      where: { shopId: user.shopId!, OR: [{ userId: user.id }, { userId: null }] },
      data:  { isRead: true, readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
});
