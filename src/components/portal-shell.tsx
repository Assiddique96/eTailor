"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/logout-button";

type PortalShellProps = {
  user: { fullName: string; platformRole: string; shopName?: string };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: "⬛" },
  { href: "/customers",  label: "Customers",  icon: "👥" },
  { href: "/jobs",       label: "Jobs",        icon: "🧵" },
  { href: "/billing",    label: "Billing",     icon: "💳" },
  { href: "/messages",   label: "Messages",    icon: "💬" },
  { href: "/team",       label: "Team",        icon: "🔐" },
  { href: "/search",     label: "Search",      icon: "🔍" },
  { href: "/audit",      label: "Audit",       icon: "📋" },
  { href: "/settings",   label: "Settings",    icon: "⚙️" },
];

const NAV_ICONS: Record<string, string> = {
  "/dashboard": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  "/customers": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  "/jobs": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
  "/billing": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>`,
  "/messages": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  "/team": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  "/search": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  "/settings": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  "/audit": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
};

function NavIcon({ href }: { href: string }) {
  const svg = NAV_ICONS[href] ?? "";
  return <span dangerouslySetInnerHTML={{ __html: svg }} className="flex-shrink-0" />;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-semibold text-sm">
          eT
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-100">eTailor</p>
          {user.shopName && (
            <p className="text-xs text-stone-500 truncate max-w-[120px]">{user.shopName}</p>
          )}
        </div>
      </div>

      <hr className="border-stone-800 mx-4 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto space-y-0.5">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-stone-600">Workspace</p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
          >
            <NavIcon href={item.href} />
            {item.label}
          </Link>
        ))}

        {user.platformRole === "SUPER_ADMIN" && (
          <>
            <hr className="border-stone-800 mx-2 my-2" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-600">Platform</p>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="sidebar-link"
              style={{ color: "#fca5a5" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      <hr className="border-stone-800 mx-4" />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-700 text-xs font-medium text-stone-300">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-stone-300">{user.fullName}</p>
            <p className="truncate text-[10px] text-stone-600">{user.platformRole}</p>
          </div>
          <LogoutButton compact />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0" style={{ background: "var(--bg-sidebar)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 flex flex-col z-10 shadow-2xl" style={{ background: "var(--bg-sidebar)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-secondary hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-sm font-semibold">eTailor</span>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
