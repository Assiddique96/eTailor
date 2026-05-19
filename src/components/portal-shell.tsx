"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { LogoutButton } from "@/components/logout-button";
import { NAV_ICON_MAP, IconAdmin, IconCatalog } from "@/components/nav-icons";
import { NotificationsBell } from "@/components/notifications-bell";

type PortalShellProps = {
  user: { fullName: string; platformRole: string; shopName?: string };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/jobs",      label: "Jobs" },
  { href: "/billing",   label: "Billing" },
  { href: "/messages",  label: "Messages" },
  { href: "/team",      label: "Team" },
  { href: "/catalog",   label: "Catalog" },
  { href: "/search",    label: "Search" },
  { href: "/audit",     label: "Audit" },
  { href: "/settings",  label: "Settings" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Sidebar content extracted to module scope so it is stable across renders.
// Defining it inside PortalShell would create a new function reference every
// render, causing React to unmount/remount the entire sidebar subtree.
type SidebarContentProps = {
  user: PortalShellProps["user"];
  pathname: string;
  onNavClick: () => void;
};

function SidebarContent({ user, pathname, onNavClick }: SidebarContentProps) {
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-semibold text-sm">
          eT
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-100">eTailor</p>
          {user.shopName && (
            <p className="text-xs text-stone-500 truncate max-w-[120px]">
              {user.shopName}
            </p>
          )}
        </div>
      </div>

      <hr className="border-stone-800 mx-4 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto space-y-0.5" aria-label="Main navigation">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-stone-600">
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICON_MAP[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
            >
              {Icon && <Icon />}
              {item.label}
            </Link>
          );
        })}

        {user.platformRole === "SUPER_ADMIN" && (
          <>
            <hr className="border-stone-800 mx-2 my-2" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-600">
              Platform
            </p>
            <Link
              href="/admin"
              onClick={onNavClick}
              className="sidebar-link"
              style={{ color: "var(--danger)" }}
            >
              <IconAdmin />
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
            <p className="truncate text-xs font-medium text-stone-300">
              {user.fullName}
            </p>
            <p className="truncate text-[10px] text-stone-600">
              {user.platformRole}
            </p>
          </div>
          <LogoutButton compact />
          <NotificationsBell />
        </div>
      </div>
    </div>
  );
}

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  // Swipe-to-close: detect a leftward swipe (≥60px horizontal, <80px vertical)
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!swipeStart.current) return;
    const t = e.changedTouches[0];
    const dx = swipeStart.current.x - t.clientX;
    const dy = Math.abs(swipeStart.current.y - t.clientY);
    if (dx > 60 && dy < 80) closeMobile();
    swipeStart.current = null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0"
        style={{ background: "var(--bg-sidebar)" }}
      >
        <SidebarContent user={user} pathname={pathname} onNavClick={closeMobile} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            className="relative w-64 flex flex-col z-10 shadow-2xl"
            style={{ background: "var(--bg-sidebar)" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label="Navigation sidebar"
          >
            <SidebarContent user={user} pathname={pathname} onNavClick={closeMobile} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header
          className="flex md:hidden items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-secondary hover:text-primary transition-colors"
            aria-label="Open navigation menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
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
