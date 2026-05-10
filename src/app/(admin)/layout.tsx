import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.platformRole !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <AdminShell user={{ fullName: user.fullName, email: user.email }}>
      {children}
    </AdminShell>
  );
}
