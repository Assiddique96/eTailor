"use client";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { ImageUploader } from "@/components/ui/image-uploader";

type ShopSettings = {
  id: string; 
  name: string; 
  slug: string;
  email?: string | null; 
  phone?: string | null; 
  address?: string | null;
  currency?: string;
  paymentTerms?: string;
  bankDetails?: string;
  logoUrl?: string | null;
};

type Profile = {
  id: string; 
  fullName: string; 
  email: string; 
  platformRole: string;
};

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div>
        <h2 className="font-semibold text-sm">{title}</h2>
        <p className="text-xs text-secondary mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [shop, setShop]       = useState<ShopSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const { data: settingsData } = useSWR<{ shop: ShopSettings; profile: Profile }>(
    "/api/settings", 
    fetcher, 
    {
      onSuccess: (d) => {
        // TypeScript now automatically knows that 'd' has .shop and .profile!
        if (d.shop)    setShop(d.shop);
        if (d.profile) setProfile(d.profile);
      },
    }
  );

  const isLoading = !settingsData && !shop && !profile;

  async function save(section: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(section);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch(`/api/settings?section=${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "object"
          ? Object.values(data.error).flat().join(", ")
          : data.error || "Failed to save.";
        toast(msg, "error");
        return;
      }
      if (data.shop)    setShop(data.shop);
      if (data.profile) setProfile(data.profile);
      toast(
        section === "shop"     ? "Shop settings saved." :
        section === "profile"  ? "Profile updated." :
        "Password changed."
      );
      if (section === "password") (e.target as HTMLFormElement).reset();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSaving(null);
    }
  }

  const isAdmin = profile?.platformRole === "SHOP_ADMIN" || profile?.platformRole === "SUPER_ADMIN";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-secondary mt-0.5">Manage your shop and account preferences.</p>
      </div>

      <hr className="divider" />

      {/* ── Shop settings ── */}
      {isAdmin && (
        <>
          <Section
            title="Shop profile"
            desc="This information appears on your invoices and is visible to customers on their tracking page."
          >
            {isLoading ? (
              <div className="card p-5 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
              </div>
            ) : (
              <form onSubmit={(e) => save("shop", e)} className="card p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Shop name *</label>
                  <input name="name" defaultValue={shop?.name ?? ""} required className="field" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Email</label>
                    <input name="email" type="email" defaultValue={shop?.email ?? ""} className="field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-secondary">Phone</label>
                    <input name="phone" type="tel" defaultValue={shop?.phone ?? ""} className="field" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Address</label>
                  <input name="address" defaultValue={shop?.address ?? ""} placeholder="e.g. 12 Broad Street, Lagos" className="field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Currency</label>
                  <select name="currency" defaultValue={shop?.currency ?? "NGN"} className="field">
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GHS">Ghanaian Cedi (₵)</option>
                    <option value="KES">Kenyan Shilling (KSh)</option>
                    <option value="ZAR">South African Rand (R)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Payment terms</label>
                  <input name="paymentTerms" defaultValue={shop?.paymentTerms ?? ""} placeholder="e.g. Payment due within 7 days of issue" className="field" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-secondary">Bank details</label>
                  <textarea name="bankDetails" defaultValue={shop?.bankDetails ?? ""} placeholder="Bank name · Account number · Account name — printed on every invoice" className="field" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-secondary">Shop URL slug</label>
                  <div className="field flex items-center gap-2 bg-stone-50 dark:bg-stone-900 cursor-not-allowed" style={{ color: "var(--text-muted)" }}>
                    <span className="text-muted text-xs">etailor.com/</span>
                    <span className="font-mono text-sm">{shop?.slug}</span>
                  </div>
                  <p className="text-xs text-muted">Shop slug cannot be changed after registration.</p>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving === "shop"}>
                    {saving === "shop" ? "Saving…" : "Save shop settings"}
                  </button>
                </div>
              </form>
            )}
          </Section>

          <hr className="divider" />
        </>
      )}

      {/* ── Personal profile ── */}
      <Section
        title="Personal profile"
        desc="Update your display name and email address used to sign in."
      >
        {isLoading ? (
          <div className="card p-5 space-y-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
          </div>
        ) : (
          <form onSubmit={(e) => save("profile", e)} className="card p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Full name *</label>
              <input name="fullName" defaultValue={profile?.fullName ?? ""} required className="field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Email address *</label>
              <input name="email" type="email" defaultValue={profile?.email ?? ""} required className="field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Role</label>
              <div className="field" style={{ background: "var(--bg-base)", color: "var(--text-muted)", cursor: "not-allowed" }}>
                {profile?.platformRole}
              </div>
              <p className="text-xs text-muted">Your platform role cannot be changed here.</p>
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving === "profile"}>
                {saving === "profile" ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </Section>

      <hr className="divider" />

      {/* ── Password change ── */}
      <Section
        title="Change password"
        desc="Choose a strong password of at least 8 characters. You'll need your current password to confirm."
      >
        <form onSubmit={(e) => save("password", e)} className="card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Current password *</label>
            <input name="currentPassword" type="password" required autoComplete="current-password" className="field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">New password *</label>
            <input name="newPassword" type="password" minLength={8} required autoComplete="new-password" className="field" />
            <p className="text-xs text-muted">Minimum 8 characters.</p>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving === "password"}>
              {saving === "password" ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </Section>

      <hr style={{ borderColor: "var(--border)" }} />

      {/* ── Shop logo ── */}
      <Section 
        title="Shop logo" 
        desc="Shown on your dashboard and printed on invoices. Recommended: square PNG or SVG, at least 256×256 px."
      >
        <div className="card p-5 space-y-4">
          {shop && (
            <ImageUploader
              folder={`/etailor/${shop.id}/logo`}
              fileName="shop-logo"
              currentUrl={shop.logoUrl?.split("?")[0] ?? null}
              label="Logo"
              hint="PNG, JPG or SVG · square · max 5 MB"
              aspectHint="1:1"
              onUploaded={async (result) => {
                const res = await fetch("/api/settings/logo", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(result),
                });
                if (res.ok) {
                  toast("Logo saved.");
                  const d = await res.json();
                  setShop((prev) => prev ? { ...prev, logoUrl: d.logoUrl } : prev);
                } else {
                  toast("Failed to save logo.", "error");
                }
              }}
              onError={(msg) => toast(msg, "error")}
            />
          )}
          {shop?.logoUrl && (
            <button
              className="btn btn-ghost btn-sm text-danger"
              onClick={async () => {
                await fetch("/api/settings/logo", { method: "DELETE" });
                setShop((prev) => prev ? { ...prev, logoUrl: null } : prev);
                toast("Logo removed.");
              }}
            >
              Remove logo
            </button>
          )}
        </div>
      </Section>

      <hr style={{ borderColor: "var(--border)" }} />

      {/* ── Data export ── */}
      <Section 
        title="Data export" 
        desc="Download a full export of your shop data including customers, jobs, invoices, and payments."
      >
        <div className="card p-5">
          <p className="text-sm text-secondary mb-4">
            Export all your shop data as a JSON file. This includes all customers, jobs, invoices, and payment records.
          </p>
          <a href="/api/export" download className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download shop data
          </a>
        </div>
      </Section>

      <hr style={{ borderColor: "var(--border)" }} />

      {/* ── Appearance ── */}
      <Section 
        title="Appearance" 
        desc="Choose your preferred colour scheme. 'System' follows your OS setting."
      >
        <div className="card p-5">
          <div
            className="flex gap-2"
            role="radiogroup"
            aria-label="Theme preference"
          >
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={theme === t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-transparent text-secondary hover:text-primary hover:border-stone-300 dark:hover:border-stone-700"
                }`}
                style={{ border: "1px solid" }}
              >
                {t === "system" ? "🖥 System" : t === "light" ? "☀️ Light" : "🌙 Dark"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Preference is saved locally in your browser.
          </p>
        </div>
      </Section>
    </div>
  );
}