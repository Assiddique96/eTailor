import type { User } from "@/generated/prisma/client";

type UserWithRoles = User & {
  userRoles: Array<{
    role: {
      permissions: Array<{
        permission: { key: string };
      }>;
    };
  }>;
};

export function hasPermission(user: UserWithRoles, permissionKey: string) {
  // Platform-wide and shop owners always have full access
  if (user.platformRole === "SUPER_ADMIN") return true;
  if (user.platformRole === "SHOP_ADMIN") return true;

  // Employees are checked against their assigned role permissions
  return user.userRoles.some((userRole) =>
    userRole.role.permissions.some((entry) => entry.permission.key === permissionKey)
  );
}

export function canAccessShop(user: UserWithRoles, shopId?: string | null) {
  if (user.platformRole === "SUPER_ADMIN") return true;
  return !!shopId && user.shopId === shopId;
}