import type { CSSProperties } from "react";

type BadgeVariant =
  | "pending" | "progress" | "fitting" | "completed"
  | "delivered" | "cancelled" | "paid" | "partial" | "unpaid";

const VARIANT_STYLES: Record<BadgeVariant, CSSProperties> = {
  pending:   { background: "var(--warn-light)",    color: "var(--warn)" },
  progress:  { background: "var(--info-light)",    color: "var(--info)" },
  fitting:   { background: "var(--purple-light)",  color: "var(--purple)" },
  completed: { background: "var(--success-light)", color: "var(--success)" },
  delivered: { background: "var(--success-light)", color: "var(--success)" },
  cancelled: { background: "var(--border)",        color: "var(--text-muted)" },
  paid:      { background: "var(--success-light)", color: "var(--success)" },
  partial:   { background: "var(--warn-light)",    color: "var(--warn)" },
  unpaid:    { background: "var(--danger-light)",  color: "var(--danger)" },
};

const STATUS_TO_VARIANT: Record<string, BadgeVariant> = {
  PENDING: "pending", IN_PROGRESS: "progress", READY_FOR_FITTING: "fitting",
  COMPLETED: "completed", DELIVERED: "delivered", CANCELLED: "cancelled",
  PAID: "paid", PARTIAL: "partial", UNPAID: "unpaid",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_TO_VARIANT[status];
  const style = variant ? VARIANT_STYLES[variant] : {};
  const label = status.replace(/_/g, " ");
  return (
    <span
      className="badge"
      style={style}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
