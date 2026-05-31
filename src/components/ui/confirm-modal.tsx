"use client";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
};

/**
 * Accessible confirmation dialog.
 * Replaces all native window.confirm() calls so destructive actions
 * are styled, accessible, and consistent with the rest of the UI.
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(false);
 *   <ConfirmModal
 *     open={confirm}
 *     onClose={() => setConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Delete item"
 *     message={`Delete "${name}"? This cannot be undone.`}
 *     danger
 *   />
 */
export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Confirm", danger = false, loading = false,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // Auto-focus the primary action so Enter confirms
    setTimeout(() => confirmRef.current?.focus(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-sm rounded-xl z-10"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 id="confirm-title" className="font-semibold text-base mb-1">{title}</h2>
          <p id="confirm-desc" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        </div>
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
        >
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="btn btn-sm"
            style={{
              background: danger ? "var(--danger)" : "var(--brand)",
              color: "#fff",
              borderColor: "transparent",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
