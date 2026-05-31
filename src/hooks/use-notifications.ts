"use client";
import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

type Notification = {
  id: string; type: string; title: string; body: string;
  isRead: boolean; createdAt: string; entityId?: string; entityType?: string;
};

/**
 * SSE + polling hybrid.
 *
 * - SSE push delivers immediate updates when the server broadcasts.
 * - refreshInterval: 30_000 is the safety net: if the SSE connection is
 *   lost, dropped by a proxy, or the shop is multi-instance (see notifications.ts),
 *   the UI still catches up within 30 seconds via normal SWR polling.
 */
export function useNotifications() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<{
    notifications: Notification[];
    unreadCount: number;
  }>("/api/notifications", fetcher, { refreshInterval: 30_000 });

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "notification") {
          mutate("/api/notifications");
        }
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      // Browser auto-reconnects EventSource after 3 s; polling covers the gap.
    };

    return () => { es.close(); };
  }, [mutate]);

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    mutate("/api/notifications");
  }

  return {
    notifications: data?.notifications ?? [],
    unreadCount:   data?.unreadCount   ?? 0,
    isLoading,
    markRead,
    markAllRead: () => markRead(),
  };
}
