// lib/rbac.ts
export type Role = "SHOP_ADMIN" | "SHOP_STAFF";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SHOP_ADMIN: [
    "customers.read",
    "customers.write",
    "products.read",
    "products.write",
  ],
  SHOP_STAFF: [
    "customers.read",
    "products.read",
  ],
};

export function hasPermission(user: any, permission: string) {
  // Fallback to empty array if role is missing
  const permissions = ROLE_PERMISSIONS[user.platformRole] || [];
  return permissions.includes(permission);
}
//rbac end