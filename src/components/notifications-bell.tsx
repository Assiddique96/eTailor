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
  const buttonRef = useRef<HTMLButtonElement>(null);  // ← add button ref
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Recalculate position when opening
  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 320 - 8), // prevent overflow right
      });
    }
    setOpen((o) => !o);
  }

  // Close panel when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}              // ← attach ref
        onClick={handleToggle}       // ← use new handler
        className="relative p-1.5 rounded-lg text-secondary hover:text-primary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
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

      {/* Dropdown — fixed positioning escapes sidebar overflow clipping */}
      {open && (
        <div
          ref={panelRef}
          className="fixed w-80 rounded-xl shadow-2xl z-[999]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            top: dropdownPos.top,
            left: dropdownPos.left,
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
                onClick={() => markAllRead()}
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
                    background: n.isRead ? undefined : "color-mix(in srgb, var(--brand-light) 40%, transparent)",
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