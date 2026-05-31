"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/currency";

type Material = {
  id: string; name: string; colour?: string; quantityMetres?: number;
  unitCost?: number; totalCost?: number; supplier?: string; notes?: string;
};

const DEFAULT = { name: "", colour: "", quantityMetres: "", unitCost: "", supplier: "", notes: "" };

export function JobMaterials({ jobId }: { jobId: string }) {
  const { toast } = useToast();
  const [form, setForm]       = useState(DEFAULT);
  const [adding, setAdding]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data, mutate } = useSWR<{ materials: Material[] }>(
    `/api/jobs/${jobId}/materials`, fetcher
  );
  const materials = data?.materials ?? [];

  const totalMaterialCost = materials.reduce((s, m) => s + Number(m.totalCost ?? 0), 0);

  function field(name: keyof typeof DEFAULT) {
    return {
      value: form[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  async function addMaterial() {
    if (!form.name.trim()) { toast("Material name is required.", "error"); return; }
    setAdding(true);
    try {
      const qty  = form.quantityMetres ? Number(form.quantityMetres) : undefined;
      const unit = form.unitCost        ? Number(form.unitCost)       : undefined;
      const res  = await fetch(`/api/jobs/${jobId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           form.name,
          colour:         form.colour  || undefined,
          quantityMetres: qty,
          unitCost:       unit,
          supplier:       form.supplier || undefined,
          notes:          form.notes   || undefined,
        }),
      });
      if (!res.ok) { toast("Failed to add material.", "error"); return; }
      toast("Material added.");
      setForm(DEFAULT);
      setShowForm(false);
      mutate();
    } catch { toast("Network error.", "error"); }
    finally { setAdding(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">
          Materials ({materials.length})
          {totalMaterialCost > 0 && (
            <span className="ml-2 text-xs font-mono" style={{ color: "var(--warn)" }}>
              {formatCurrency(totalMaterialCost)} total cost
            </span>
          )}
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add material"}
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Material name *</label>
              <input className="field" placeholder="e.g. Ankara cotton" {...field("name")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Colour</label>
              <input className="field" placeholder="Navy blue" {...field("colour")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Quantity (metres)</label>
              <input type="number" step="0.1" min="0" className="field" {...field("quantityMetres")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Unit cost (₦/m)</label>
              <input type="number" step="0.01" min="0" className="field" {...field("unitCost")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Supplier</label>
              <input className="field" placeholder="Balogun Market" {...field("supplier")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Notes</label>
              <input className="field" placeholder="Any details…" {...field("notes")} />
            </div>
          </div>

          {form.quantityMetres && form.unitCost && (
            <p className="text-xs text-secondary">
              Estimated total: <strong>{formatCurrency(Number(form.quantityMetres) * Number(form.unitCost))}</strong>
            </p>
          )}

          <div className="flex justify-end">
            <button className="btn btn-primary btn-sm" onClick={addMaterial} disabled={adding}>
              {adding ? "Adding…" : "Add material"}
            </button>
          </div>
        </div>
      )}

      {materials.length === 0 && !showForm ? (
        <p className="text-sm text-muted text-center py-4">No materials recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-medium">
                  {m.name}
                  {m.colour && <span className="text-muted font-normal"> · {m.colour}</span>}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {m.quantityMetres && `${m.quantityMetres}m`}
                  {m.quantityMetres && m.unitCost && " @ "}
                  {m.unitCost && `₦${Number(m.unitCost).toFixed(2)}/m`}
                  {m.supplier && ` · ${m.supplier}`}
                </p>
              </div>
              {m.totalCost && (
                <span className="text-sm font-medium shrink-0">
                  {formatCurrency(m.totalCost)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



