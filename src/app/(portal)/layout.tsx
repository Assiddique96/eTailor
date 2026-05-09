import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <PortalShell
      user={{
        fullName: user.fullName,
        platformRole: user.platformRole,
      }}
    >
      {children}
    </PortalShell>
  );
}
