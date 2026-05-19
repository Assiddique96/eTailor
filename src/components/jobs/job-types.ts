export type Job = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueDate: string;
  trackingCode: string;
  customer: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; fullName: string } | null;
};

export type Customer = { id: string; firstName: string; lastName: string };

export const ALL_STATUSES = [
  "PENDING", "IN_PROGRESS", "READY_FOR_FITTING",
  "COMPLETED", "DELIVERED", "CANCELLED",
] as const;

export const BOARD_COLUMNS = [
  { status: "PENDING",           label: "Pending" },
  { status: "IN_PROGRESS",       label: "In Progress" },
  { status: "READY_FOR_FITTING", label: "Ready for Fitting" },
  { status: "COMPLETED",         label: "Completed" },
  { status: "DELIVERED",         label: "Delivered" },
] as const;

export function priorityLabel(p: number) {
  return ["", "🔴 Urgent", "🟠 High", "Normal", "🟢 Low", "⚪ Minimal"][p] ?? String(p);
}

export function priorityDot(p: number) {
  return ["", "🔴", "🟠", "", "🟢", "⚪"][p] ?? "";
}

export function isOverdue(dueDate: string, status: string) {
  return (
    new Date(dueDate) < new Date() &&
    !["DELIVERED", "CANCELLED"].includes(status)
  );
}
