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
  if (user.platformRole === "SUPER_ADMIN") return true;
  return user.userRoles.some((userRole) =>
    userRole.role.permissions.some((entry) => entry.permission.key === permissionKey)
  );
}

export function canAccessShop(user: UserWithRoles, shopId?: string | null) {
  if (user.platformRole === "SUPER_ADMIN") return true;
  return !!shopId && user.shopId === shopId;
}
