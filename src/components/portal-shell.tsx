import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type PortalShellProps = {
  user: {
    fullName: string;
    platformRole: string;
  };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/billing", label: "Billing" },
  { href: "/team", label: "Team" },
  { href: "/messages", label: "Messages" },
  { href: "/audit", label: "Audit" },
  { href: "/search", label: "Search" },
];

export function PortalShell({ user, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">eTailor Workspace</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.fullName} ({user.platformRole})
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="surface-card-soft space-y-1 p-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-white hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 space-y-4">{children}</main>
      </div>
    </div>
  );
}
