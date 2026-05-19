"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { PERMISSIONS } from "@/lib/permissions";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

export function CreateRoleModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Role name is required.";
    if (selected.size === 0) e.permissions = "Select at least one permission.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggle(perm: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, permissions: Array.from(selected) }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error ?? "Failed.", "error"); return; }
      toast("Role created.");
      setName(""); setDescription(""); setSelected(new Set()); setErrors({});
      onCreated();
      onClose();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create role"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create role"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Role name *</label>
            <input className="field" placeholder="e.g. Sales Associate" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Description</label>
            <input className="field" placeholder="What can this role do?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-secondary mb-2 block">Permissions *</label>
          {errors.permissions && <p className="text-xs text-danger mb-2">{errors.permissions}</p>}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has(perm)}
                  onChange={() => toggle(perm)}
                  className="rounded accent-indigo-600"
                  aria-label={perm}
                />
                <span className="text-secondary group-hover:text-primary transition-colors font-mono text-xs">{perm}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
