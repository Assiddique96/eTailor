export const PERMISSIONS = [
  "customers.read",
  "customers.write",
  "measurements.write",
  "jobs.read",
  "jobs.write",
  "jobs.assign",
  "invoices.read",
  "invoices.write",
  "payments.read",
  "payments.write",
  "reports.read",
  "settings.manage",
  "users.manage",
  "audit.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];
