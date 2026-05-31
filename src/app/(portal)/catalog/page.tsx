"use client";
import { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageUploader } from "@/components/ui/image-uploader";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: string; name: string; description?: string; sortOrder: number;
  _count: { items: number };
};
type CatalogItem = {
  id: string; name: string; description?: string;
  imageUrl: string; tags: string[]; isActive: boolean;
  category: { id: string; name: string };
};

export default function CatalogPage() {
  const { toast } = useToast();
  const [activeCatId, setActiveCatId] = useState<string | "all">("all");
  const [showNewCat, setShowNewCat]   = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  // Confirm modal state — replaces all window.confirm() calls
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    loading: boolean;
  }>({ open: false, title: "", message: "", onConfirm: async () => {}, loading: false });

  const { data: catData, isLoading: catLoading, mutate: mutateCats } =
    useSWR<{ categories: Category[]; shopId: string }>("/api/catalog/categories", fetcher);

  const shopId = catData?.shopId ?? "";

  const itemUrl = activeCatId === "all"
    ? "/api/catalog/items"
    : `/api/catalog/items?categoryId=${activeCatId}`;
  const { data: itemData, isLoading: itemLoading, mutate: mutateItems } =
    useSWR<{ items: CatalogItem[] }>(itemUrl, fetcher);

  const categories = catData?.categories ?? [];
  const items      = itemData?.items      ?? [];

  function openConfirm(title: string, message: string, action: () => Promise<void>) {
    setConfirmState({ open: true, title, message, onConfirm: action, loading: false });
  }

  const handleConfirm = useCallback(async () => {
    setConfirmState((s) => ({ ...s, loading: true }));
    try {
      await confirmState.onConfirm();
    } finally {
      setConfirmState((s) => ({ ...s, open: false, loading: false }));
    }
  }, [confirmState]);

  function deleteItem(id: string, name: string) {
    openConfirm(
      "Delete style",
      `Delete "${name}"? This cannot be undone.`,
      async () => {
        const res = await fetch(`/api/catalog/items/${id}`, { method: "DELETE" });
        if (res.ok) { toast("Style deleted."); mutateItems(); }
        else toast("Failed to delete style.", "error");
      }
    );
  }

  function deleteCategory(id: string, name: string, count: number) {
    const message = count > 0
      ? `"${name}" has ${count} style${count > 1 ? "s" : ""}. Deleting the category will also delete all its items. Continue?`
      : `Delete category "${name}"?`;
    openConfirm("Delete category", message, async () => {
      const res = await fetch(`/api/catalog/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Category deleted.");
        mutateCats();
        mutateItems();
        if (activeCatId === id) setActiveCatId("all");
      } else toast("Failed to delete category.", "error");
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Style Catalog"
        subtitle="Manage garment styles and inspiration images for your customers"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNewCat(true)}>
              + Category
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewItem(true)}
              disabled={categories.length === 0}
            >
              + Add style
            </button>
          </div>
        }
      />

      <div className="flex gap-5">
        {/* ── Sidebar: category list ── */}
        <aside className="w-48 shrink-0 space-y-1">
          <button
            onClick={() => setActiveCatId("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCatId === "all"
                ? "font-medium text-brand" : "text-secondary hover:text-primary"
            }`}
            style={activeCatId === "all" ? { background: "var(--brand-light)" } : {}}
          >
            All styles
            <span className="ml-1 text-xs text-muted">
              ({categories.reduce((s, c) => s + c._count.items, 0)})
            </span>
          </button>

          {catLoading && [0,1,2].map(i => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}

          {categories.map(cat => (
            <div key={cat.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveCatId(cat.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeCatId === cat.id
                    ? "font-medium text-brand" : "text-secondary hover:text-primary"
                }`}
                style={activeCatId === cat.id ? { background: "var(--brand-light)" } : {}}
              >
                {cat.name}
                <span className="ml-1 text-xs text-muted">({cat._count.items})</span>
              </button>
              <button
                onClick={() => deleteCategory(cat.id, cat.name, cat._count.items)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-danger transition-all"
                aria-label={`Delete ${cat.name}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}

          {categories.length === 0 && !catLoading && (
            <p className="text-xs text-muted px-3 pt-2">No categories yet.</p>
          )}
        </aside>

        {/* ── Main: item grid ── */}
        <div className="flex-1 min-w-0">
          {itemLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="🎨"
                title="No styles in this category"
                description={`Click "+ Add style" to upload your first garment image.`}
                action={
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowNewItem(true)}
                    disabled={categories.length === 0}
                  >
                    + Add style
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <CatalogCard
                  key={item.id}
                  item={item}
                  onDelete={() => deleteItem(item.id, item.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <NewCategoryModal
        open={showNewCat}
        onClose={() => setShowNewCat(false)}
        onCreated={() => { mutateCats(); setShowNewCat(false); }}
      />

      <NewItemModal
        key={showNewItem ? "open" : "closed"}
        open={showNewItem}
        onClose={() => setShowNewItem(false)}
        categories={categories}
        shopId={shopId}
        defaultCategoryId={activeCatId !== "all" ? activeCatId : undefined}
        onCreated={() => {
          mutateItems(undefined, { revalidate: true });
          setShowNewItem(false);
        }}
      />

      {/* Accessible confirm dialog — replaces window.confirm() */}
      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Delete"
        danger
        loading={confirmState.loading}
      />
    </div>
  );
}

// ── Catalog item card ────────────────────────────────────────────────────────
function CatalogCard({ item, onDelete }: { item: CatalogItem; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cleanUrl = item.imageUrl.split("?")[0];

  return (
    <div
      className="card overflow-hidden group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cleanUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div
        className="absolute inset-0 flex flex-col justify-end p-3 transition-opacity duration-200"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
          opacity: hovered ? 1 : 0,
        }}
        aria-hidden={!hovered}
      >
        <p className="text-white text-sm font-medium leading-tight">{item.name}</p>
        {item.category && (
          <p className="text-white/70 text-xs mt-0.5">{item.category.name}</p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="mt-2 self-end p-1.5 rounded-lg bg-white/20 hover:bg-red-500 text-white transition-colors"
          aria-label={`Delete ${item.name}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      <div className="p-2.5">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Category modal ───────────────────────────────────────────────────────
function NewCategoryModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const { toast } = useToast();
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    if (!name.trim()) { setError("Category name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/catalog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Category created.");
      setName(""); setDesc(""); setError("");
      onCreated();
    } else {
      const e = await res.json();
      toast(e.error ?? "Failed.", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New category"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Category name *</label>
          <input
            className="field"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Wedding, Corporate, Casual"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Description</label>
          <input
            className="field"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Optional short description"
          />
        </div>
      </div>
    </Modal>
  );
}

// ── New Item modal ───────────────────────────────────────────────────────────
function NewItemModal({ open, onClose, categories, defaultCategoryId, onCreated, shopId }: {
  open: boolean; onClose: () => void;
  categories: Category[]; defaultCategoryId?: string;
  onCreated: () => void;
  shopId: string;
}) {
  const { toast } = useToast();
  const [fields, setFields] = useState({
    categoryId:  defaultCategoryId ?? categories[0]?.id ?? "",
    name:        "",
    description: "",
    tags:        "",
  });
  const [itemGenders, setItemGenders] = useState<string[]>([]);
  const [upload, setUpload] = useState<{ url: string; filePath: string; fileId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.categoryId) e.categoryId = "Select a category.";
    if (!fields.name.trim()) e.name = "Name is required.";
    if (!upload) e.image = "Upload an image.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    const res = await fetch("/api/catalog/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId:  fields.categoryId,
        name:        fields.name.trim(),
        description: fields.description.trim() || undefined,
        imageUrl:    upload!.url,
        imagePath:   upload!.filePath,
        tags:        fields.tags.split(",").map(t => t.trim()).filter(Boolean),
        gender:      itemGenders,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast("Style added to catalog.");
      onCreated();
    } else {
      const e = await res.json();
      toast(e.error ?? "Failed.", "error");
    }
  }

  const catId = fields.categoryId || categories[0]?.id || "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add style to catalog"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={submit}
            disabled={saving || !upload}
          >
            {saving ? "Saving…" : "Add style"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Category *</label>
            <select
              className="field"
              value={catId}
              onChange={e => setFields(f => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Style name *</label>
            <input
              className="field"
              placeholder="e.g. Classic Fitted Suit"
              value={fields.name}
              onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Description</label>
          <input
            className="field"
            placeholder="Brief description of this style"
            value={fields.description}
            onChange={e => setFields(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Tags (comma-separated)</label>
          <input
            className="field"
            placeholder="formal, slim-fit, navy"
            value={fields.tags}
            onChange={e => setFields(f => ({ ...f, tags: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-secondary mb-2 block">
            Gender relevance{" "}
            <span className="text-muted font-normal">(select all that apply)</span>
          </label>
          <div className="flex gap-2" role="group" aria-label="Gender relevance">
            {(["MALE", "FEMALE", "OTHER"] as const).map((g) => {
              const labels = { MALE: "♂ Male", FEMALE: "♀ Female", OTHER: "⚧ All" };
              const on = itemGenders.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setItemGenders(prev =>
                      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                    )
                  }
                  aria-pressed={on}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: on ? "var(--brand)"       : "var(--border)",
                    background:  on ? "var(--brand-light)" : "var(--bg-card)",
                    color:       on ? "var(--brand)"       : "var(--text-secondary)",
                  }}
                >
                  {labels[g]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-1">Leave unselected to show for all genders.</p>
        </div>

        <div>
          <ImageUploader
            folder={`/etailor/${shopId}/catalog`}
            fileName={`${fields.name || "catalog-item"}-${Date.now()}`}
            label="Style image *"
            hint="JPG, PNG or WebP · max 5 MB"
            aspectHint="3:4"
            onUploaded={result => {
              setUpload(result);
              setErrors(e => ({ ...e, image: "" }));
            }}
            onError={msg => toast(msg, "error")}
          />
          {errors.image && <p className="text-xs text-danger mt-1">{errors.image}</p>}
        </div>
      </div>
    </Modal>
  );
}



