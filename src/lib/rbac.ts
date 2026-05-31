import type { User } from "@/generated/prisma/client";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

type UserWithRoles = User & {
  userRoles: Array<{
    role: {
      permissions: Array<{
        permission: { key: string };
      }>;
    };
  }>;
};

/**
 * SUPER_ADMIN: platform-wide — bypasses shop-level checks entirely.
 *
 * SHOP_ADMIN: granted full access through seeded role permissions (see prisma/seed.ts).
 * The previous hard-coded `return true` bypass has been removed. Access is now
 * fully data-driven: if the SHOP_ADMIN's role lacks a permission in the DB,
 * they genuinely don't have it — which makes role editing auditable and safe.
 *
 * The reason dashboard metrics worked for SHOP_ADMIN but the customers tab
 * returned empty was that /api/dashboard uses `withAuth({})` (no permission
 * required), while /api/customers requires `customers.read`. If a SHOP_ADMIN
 * user was created without being assigned the seeded "shop-admin" role, they
 * had no permissions in userRoles and every guarded route returned 403.
 *
 * Fix: ensure every SHOP_ADMIN user is always assigned the "shop-admin" system
 * role (see src/lib/auth.ts createSessionToken → or prisma/seed.ts). This file
 * now reflects permission checks consistently across all roles.
 *
 * EMPLOYEE: granted only the permissions assigned via their roles.
 */
export function hasPermission(
  user: UserWithRoles,
  permissionKey: PermissionKey
): boolean {
  if (user.platformRole === "SUPER_ADMIN") return true;

  return user.userRoles.some((userRole) =>
    userRole.role.permissions.some(
      (entry) => entry.permission.key === permissionKey
    )
  );
}

export function canAccessShop(
  user: UserWithRoles,
  shopId?: string | null
): boolean {
  if (user.platformRole === "SUPER_ADMIN") return true;
  return !!shopId && user.shopId === shopId;
}

/**
 * Returns the full set of permission keys a user holds.
 * Useful for hydrating a client-side permission context.
 */
export function getUserPermissions(user: UserWithRoles): Set<PermissionKey> {
  if (user.platformRole === "SUPER_ADMIN") {
    return new Set(PERMISSIONS);
  }

  const keys = new Set<PermissionKey>();
  for (const userRole of user.userRoles) {
    for (const entry of userRole.role.permissions) {
      if (PERMISSIONS.includes(entry.permission.key as PermissionKey)) {
        keys.add(entry.permission.key as PermissionKey);
      }
    }
  }
  return keys;
}
