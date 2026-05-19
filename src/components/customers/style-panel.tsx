"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/ui/image-uploader";

type CatalogItem = {
  id: string; name: string; imageUrl: string; tags: string[]; gender: string[];
  category: { id: string; name: string };
};
type StyleProfile = {
  selectionMode: "CATALOG" | "UPLOAD" | "IMPRESS_ME" | null;
  catalogItemId?: string | null;
  uploadedImageUrl?: string | null;
  notes?: string | null;
  catalogItem?: {
    id: string; name: string; imageUrl: string;
    category: { name: string };
  } | null;
};

type Props = { customerId: string; shopId: string };

const MODES = [
  {
    id:    "CATALOG" as const,
    icon:  "🎨",
    label: "Select from catalog",
    desc:  "Browse your shop's style collection",
  },
  {
    id:    "UPLOAD" as const,
    icon:  "📸",
    label: "Upload a style",
    desc:  "Customer provides their own inspiration image",
  },
  {
    id:    "IMPRESS_ME" as const,
    icon:  "✨",
    label: "Impress me",
    desc:  "Leave it to the tailor's creativity",
  },
] as const;

export function StylePanel({ customerId, shopId }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [gender, setGender] = useState<string | null>(null);

  const { data: profileData, mutate: mutateProfile } =
    useSWR<{ profile: StyleProfile | null }>(`/api/customers/${customerId}/style`, fetcher);

  // Filter catalog to customer's gender by default; "all" shows everything
  const [showAllGenders, setShowAllGenders] = useState(false);
  const catalogKey = showAllGenders || !gender || gender === "OTHER"
    ? "/api/catalog/items"
    : `/api/catalog/items?gender=${gender}`;
  const { data: catalogData } = useSWR<{ items: CatalogItem[] }>(catalogKey, fetcher);

  const profile  = profileData?.profile;
  const catalog  = catalogData?.items ?? [];

  const [mode, setMode]             = useState<typeof MODES[number]["id"] | null>(profile?.selectionMode ?? null);
  const [selectedItemId, setItemId] = useState<string>(profile?.catalogItemId ?? "");
  const [uploadResult, setUpload]   = useState<{ url: string; filePath: string; fileId: string } | null>(null);
  const [notes, setNotes]           = useState(profile?.notes ?? "");
  const [catFilter, setCatFilter]   = useState<string>("all");

  // Sync local state when profile loads
  const syncedMode = mode ?? profile?.selectionMode ?? null;

  const categories = Array.from(
    new Map(catalog.map(i => [i.category.id, i.category])).values()
  );
  const filteredItems = catFilter === "all" ? catalog : catalog.filter(i => i.category.id === catFilter);

  async function save() {
    if (!syncedMode) { toast("Choose a style mode first.", "error"); return; }
    if (syncedMode === "CATALOG" && !selectedItemId) { toast("Select a catalog style.", "error"); return; }
    if (syncedMode === "UPLOAD" && !uploadResult && !profile?.uploadedImageUrl) {
      toast("Upload an image first.", "error"); return;
    }

    setSaving(true);
    try {
      const body =
        syncedMode === "CATALOG"    ? { selectionMode: "CATALOG",    catalogItemId: selectedItemId, notes } :
        syncedMode === "UPLOAD"     ? { selectionMode: "UPLOAD",     uploadedImageUrl: uploadResult?.url ?? profile?.uploadedImageUrl, uploadedImagePath: uploadResult?.filePath ?? "", notes } :
                                      { selectionMode: "IMPRESS_ME", notes };

      const res = await fetch(`/api/customers/${customerId}/style`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) { toast("Failed to save style.", "error"); return; }
      toast("Style preference saved.");
      mutateProfile();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  }

  const currentMode = syncedMode;

  return (
    <div className="space-y-5">
      {/* Current style summary */}
      {profile?.selectionMode && (
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
        >
          {profile.selectionMode === "CATALOG" && profile.catalogItem && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.catalogItem.imageUrl.split("?")[0]}
                alt={profile.catalogItem.name}
                className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
              />
              <div>
                <p className="text-xs text-muted mb-0.5">Current selection</p>
                <p className="font-medium">{profile.catalogItem.name}</p>
                <p className="text-xs text-secondary">{profile.catalogItem.category.name}</p>
              </div>
            </>
          )}
          {profile.selectionMode === "UPLOAD" && profile.uploadedImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.uploadedImageUrl.split("?")[0]}
                alt="Customer upload"
                className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
              />
              <div>
                <p className="text-xs text-muted mb-0.5">Current selection</p>
                <p className="font-medium">Customer-uploaded style</p>
              </div>
            </>
          )}
          {profile.selectionMode === "IMPRESS_ME" && (
            <>
              <div className="h-16 w-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: "var(--purple-light)" }}>✨</div>
              <div>
                <p className="text-xs text-muted mb-0.5">Current selection</p>
                <p className="font-medium">Impress me — tailor's choice</p>
              </div>
            </>
          )}
          {profile.notes && (
            <p className="ml-auto text-xs text-secondary italic max-w-[180px] text-right">"{profile.notes}"</p>
          )}
        </div>
      )}

      {/* Mode selector */}
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
          Style preference
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={currentMode === m.id}
              onClick={() => setMode(m.id)}
              className="p-4 rounded-xl border text-left transition-all"
              style={{
                borderColor: currentMode === m.id ? "var(--brand)"      : "var(--border)",
                background:  currentMode === m.id ? "var(--brand-light)": "var(--bg-card)",
              }}
            >
              <div className="text-2xl mb-2" aria-hidden>{m.icon}</div>
              <p className="text-sm font-semibold"
                style={{ color: currentMode === m.id ? "var(--brand)" : undefined }}>
                {m.label}
              </p>
              <p className="text-xs text-muted mt-0.5 leading-snug">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── CATALOG mode ── */}
      {currentMode === "CATALOG" && (
        <div className="space-y-3">
          {/* Gender filter toggle */}
          {gender && gender !== "OTHER" && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                Showing {showAllGenders ? "all" : gender === "MALE" ? "men's" : "women's"} styles
              </p>
              <button
                className="text-xs text-brand hover:underline"
                onClick={() => setShowAllGenders((v) => !v)}
              >
                {showAllGenders ? `Show ${gender === "MALE" ? "men's" : "women's"} only` : "Show all styles"}
              </button>
            </div>
          )}

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCatFilter("all")}
                className={`badge text-xs cursor-pointer ${catFilter === "all" ? "" : "opacity-60"}`}
                style={{ background: catFilter === "all" ? "var(--brand-light)" : "var(--bg-base)",
                         color: catFilter === "all" ? "var(--brand)" : "var(--text-muted)" }}>
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id)}
                  className="badge text-xs cursor-pointer"
                  style={{ background: catFilter === c.id ? "var(--brand-light)" : "var(--bg-base)",
                           color: catFilter === c.id ? "var(--brand)" : "var(--text-muted)" }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center text-sm text-secondary"
              style={{ background: "var(--bg-base)", border: "1px dashed var(--border)" }}
            >
              No styles in catalog yet. Add some in the{" "}
              <a href="/catalog" className="underline text-brand">Catalog</a> section.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredItems.map(item => {
                const selected = selectedItemId === item.id;
                const cleanUrl = item.imageUrl.split("?")[0];
                return (
                  <button
                    key={item.id}
                    onClick={() => setItemId(item.id)}
                    className="relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4]"
                    style={{
                      borderColor: selected ? "var(--brand)" : "transparent",
                      outline: selected ? "3px solid var(--brand-light)" : "none",
                    }}
                    aria-pressed={selected}
                    aria-label={`Select style: ${item.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cleanUrl} alt={item.name}
                      className="w-full h-full object-cover" loading="lazy" />
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--brand)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1.5"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                      <p className="text-white text-xs font-medium truncate">{item.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── UPLOAD mode ── */}
      {currentMode === "UPLOAD" && (
        <ImageUploader
          folder={`/etailor/${shopId}/styles/customers/${customerId}`}
          fileName={`style-${customerId}`}
          currentUrl={profile?.uploadedImageUrl}
          label="Customer's style reference"
          hint="Photo, screenshot, or sketch — JPG, PNG, WebP"
          aspectHint="Any"
          onUploaded={setUpload}
          onError={msg => toast(msg, "error")}
        />
      )}

      {/* ── IMPRESS ME mode ── */}
      {currentMode === "IMPRESS_ME" && (
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: "var(--purple-light)", border: "1px solid var(--border)" }}
        >
          <div className="text-4xl mb-3">✨</div>
          <p className="font-medium" style={{ color: "var(--purple)" }}>Tailor's creative choice</p>
          <p className="text-sm text-secondary mt-1">
            The customer trusts your expertise. Use the notes field to capture any constraints.
          </p>
        </div>
      )}

      {/* Notes (shown for all modes) */}
      {currentMode && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">
            Notes / special requests
          </label>
          <textarea
            className="field"
            rows={3}
            placeholder={
              currentMode === "IMPRESS_ME"
                ? "Any colours to avoid, occasions, constraints…"
                : "Additional notes about this style preference…"
            }
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Save button */}
      {currentMode && (
        <div className="flex justify-end">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save style preference"}
          </button>
        </div>
      )}
    </div>
  );
}
