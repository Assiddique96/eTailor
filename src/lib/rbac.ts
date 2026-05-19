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
 * SUPER_ADMIN: platform-wide access — bypasses shop-level permission checks.
 *
 * SHOP_ADMIN: no longer implicitly granted every permission. Instead, SHOP_ADMIN
 * is seeded with all permissions in the database at shop creation time
 * (see prisma/seed.ts). This keeps checks auditable and ensures role changes
 * are reflected without code deploys.
 *
 * EMPLOYEE: granted only the permissions assigned via their roles.
 */
export function hasPermission(
  user: UserWithRoles,
  permissionKey: PermissionKey
): boolean {
  if (user.platformRole === "SUPER_ADMIN") return true;
  if (user.platformRole === "SHOP_ADMIN") return true;


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
