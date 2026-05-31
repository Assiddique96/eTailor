"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/logout-button";

type AdminShellProps = {
  user: { fullName: string; email: string };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    href: "/admin/shops",
    label: "Shops",
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    href: "/admin/users",
    label: "All Users",
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    href: "/admin/audit",
    label: "Audit Trail",
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "#dc2626", color: "#fff" }}>
            SA
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#fafaf9" }}>Super Admin</p>
            <p className="text-xs" style={{ color: "#57534e" }}>Platform Control</p>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: "#292524", margin: "0 16px 8px" }} />

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-4">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#57534e" }}>Platform</p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
          >
            <span dangerouslySetInnerHTML={{ __html: item.icon }} className="shrink-0" />
            {item.label}
          </Link>
        ))}

        <hr style={{ borderColor: "#292524", margin: "12px 8px" }} />
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#57534e" }}>Navigation</p>
        <Link href="/dashboard" className="sidebar-link" onClick={() => setMobileOpen(false)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
          Back to Portal
        </Link>
      </nav>

      <hr style={{ borderColor: "#292524", margin: "0 16px" }} />
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ background: "#450a0a", color: "#fca5a5" }}>
            {initials(user.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: "#d6d3d1" }}>{user.fullName}</p>
            <p className="truncate text-[10px]" style={{ color: "#57534e" }}>{user.email}</p>
          </div>
          <LogoutButton compact />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Red-accented sidebar to visually distinguish admin from portal */}
      <aside className="hidden md:flex flex-col w-56 shrink-0" style={{ background: "var(--bg-sidebar)" }}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col z-10 shadow-2xl" style={{ background: "var(--bg-sidebar)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin top banner */}
        <div className="flex items-center justify-center py-1.5 text-xs font-medium text-white" style={{ background: "#dc2626" }}>
          ⚠ Super Admin Mode — Platform-wide access
        </div>

        {/* Mobile topbar */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-sm font-semibold text-red-600">Super Admin</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}



