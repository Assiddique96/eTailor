"use client";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";

const TYPE_ICON: Record<string, string> = {
  JOB_COMMENT:       "💬",
  MEASUREMENT_IN:    "📏",
  JOB_STATUS_CHANGE: "🔄",
  PAYMENT_RECEIVED:  "💳",
  REMINDER_SENT:     "🔔",
  INFO:              "ℹ️",
};

export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-lg text-secondary hover:text-primary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Bell icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--danger)", fontSize: 9, fontWeight: 700 }}
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-9 w-80 rounded-xl shadow-2xl z-50"
          style={{
            background:  "var(--bg-card)",
            border:      "1px solid var(--border)",
          }}
          role="region"
          aria-label="Notifications"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="font-semibold text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllRead(); }}
                className="text-xs text-brand hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50 border-b last:border-0"
                  style={{
                    borderColor: "var(--border)",
                    background:  n.isRead ? undefined : "color-mix(in srgb, var(--brand-light) 40%, transparent)",
                  }}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden>
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "var(--brand)" }}
                      aria-hidden
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
