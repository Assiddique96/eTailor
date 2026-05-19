import "dotenv/config";
import { db } from "../src/lib/db";
import { PERMISSIONS } from "../src/lib/permissions";

async function main() {
  // Upsert every permission key so the database stays in sync with code
  for (const permissionKey of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: permissionKey },
      update: {},
      create: { key: permissionKey, label: permissionKey },
    });
  }

  const shop = await db.shop.upsert({
    where: { slug: "demo-tailor" },
    update: {},
    create: { name: "Demo Tailor", slug: "demo-tailor", email: "demo@etailor.local" },
  });

  // SHOP_ADMIN system role — seeded with ALL permissions so that shop owners
  // have full access without relying on the blanket RBAC bypass that was removed.
  const shopAdminRole = await db.role.upsert({
    where: { shopId_name: { shopId: shop.id, name: "shop-admin" } },
    update: { description: "Full access — assigned to shop owners." },
    create: {
      shopId: shop.id,
      name: "shop-admin",
      description: "Full access — assigned to shop owners.",
      isSystem: true,
    },
  });
  for (const permissionKey of PERMISSIONS) {
    const permission = await db.permission.findUnique({ where: { key: permissionKey } });
    if (!permission) continue;
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: shopAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: shopAdminRole.id, permissionId: permission.id },
    });
  }

  const roleConfigs = [
    {
      name: "sales-associate",
      description: "Can manage customers, jobs and records.",
      permissions: ["customers.read", "customers.write", "measurements.write", "jobs.read", "jobs.write"],
    },
    {
      name: "manager",
      description: "Can manage operations and see reports.",
      permissions: [
        "customers.read",
        "customers.write",
        "measurements.write",
        "jobs.read",
        "jobs.write",
        "jobs.assign",
        "invoices.read",
        "payments.read",
        "reports.read",
        "audit.read",
      ],
    },
  ] as const;

  for (const roleConfig of roleConfigs) {
    const role = await db.role.upsert({
      where: { shopId_name: { shopId: shop.id, name: roleConfig.name } },
      update: { description: roleConfig.description },
      create: {
        shopId: shop.id,
        name: roleConfig.name,
        description: roleConfig.description,
      },
    });

    for (const permissionKey of roleConfig.permissions) {
      const permission = await db.permission.findUnique({ where: { key: permissionKey } });
      if (!permission) continue;
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
