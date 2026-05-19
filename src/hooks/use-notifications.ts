"use client";
import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

type Notification = {
  id: string; type: string; title: string; body: string;
  isRead: boolean; createdAt: string; entityId?: string; entityType?: string;
};

export function useNotifications() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<{
    notifications: Notification[];
    unreadCount: number;
  }>("/api/notifications", fetcher, { refreshInterval: 0 });

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE stream — push new notifications without polling
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "notification") {
          // Re-validate the notifications SWR key so the bell updates
          mutate("/api/notifications");
        }
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      // Browser will auto-reconnect EventSource on error
    };

    return () => {
      es.close();
    };
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
