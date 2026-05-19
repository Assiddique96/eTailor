"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

type Role = { id: string; name: string };
type Props = { open: boolean; onClose: () => void; roles: Role[]; onCreated: () => void };

export function CreateMemberModal({ open, onClose, roles, onCreated }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState({ fullName: "", email: "", password: "", roleId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.fullName.trim()) e.fullName = "Full name is required.";
    if (!fields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required.";
    if (fields.password.length < 8) e.password = "Minimum 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fields.fullName,
          email: fields.email,
          password: fields.password,
          roleIds: fields.roleId ? [fields.roleId] : [],
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error ?? "Failed.", "error"); return; }
      toast("Team member added.");
      setFields({ fullName: "", email: "", password: "", roleId: "" });
      setErrors({});
      onCreated();
      onClose();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  function field(name: keyof typeof fields) {
    return {
      value: fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFields((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite team member"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Full name *</label>
          <input className="field" {...field("fullName")} />
          {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Email *</label>
          <input type="email" className="field" {...field("email")} />
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Temporary password *</label>
          <input type="password" className="field" minLength={8} {...field("password")} />
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
          <p className="text-xs text-muted">Member should change this on first login.</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">Role</label>
          <select className="field" {...field("roleId")}>
            <option value="">No role (read-only)</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
