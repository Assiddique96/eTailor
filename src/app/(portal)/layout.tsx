import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shop = user.shopId
    ? await db.shop.findUnique({ where: { id: user.shopId }, select: { name: true } })
    : null;

  return (
    <PortalShell
      user={{
        fullName: user.fullName,
        platformRole: user.platformRole,
        shopName: shop?.name,
      }}
    >
      {children}
    </PortalShell>
  );
}
