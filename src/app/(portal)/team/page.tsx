"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Employee = {
  id: string; fullName: string; email: string; isActive: boolean; createdAt: string;
  userRoles: Array<{ role: { name: string } }>;
};
type Role = { id: string; name: string; description?: string; permissions: Array<{ permission: { key: string; description?: string } }> };

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"members" | "roles">("members");
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const memberFormRef = useRef<HTMLFormElement>(null);
  const roleFormRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const AVAILABLE_PERMISSIONS = [
    "customers.read","customers.write","jobs.read","jobs.write",
    "invoices.read","invoices.write","payments.read","payments.write",
    "users.manage","reports.read","audit.read","messages.read","messages.write",
  ];

  async function load() {
    const [ur, rr] = await Promise.all([fetch("/api/users"), fetch("/api/roles")]);
    const ud = await ur.json(); const rd = await rr.json();
    setEmployees(ud.users ?? []); setRoles(rd.roles ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onCreateMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          email: fd.get("email"),
          password: fd.get("password"),
          roleId: fd.get("roleId") || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Team member invited.");
      memberFormRef.current?.reset();
      setShowMemberForm(false);
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  async function onCreateRole(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const permissions = fd.getAll("permissions") as string[];
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description"),
          permissions,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Role created.");
      roleFormRef.current?.reset();
      setShowRoleForm(false);
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-secondary mt-0.5">{employees.length} member{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {tab === "members" && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowMemberForm((v) => !v)}>
              + Invite member
            </button>
          )}
          {tab === "roles" && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowRoleForm((v) => !v)}>
              + New role
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {(["members","roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? "border-indigo-500 text-brand" : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Member form */}
      {tab === "members" && showMemberForm && (
        <div className="card p-5">
          <h2 className="font-medium mb-4">Invite team member</h2>
          <form ref={memberFormRef} onSubmit={onCreateMember} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Full name *</label>
              <input name="fullName" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Email *</label>
              <input name="email" type="email" required className="field" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Temporary password *</label>
              <input name="password" type="password" minLength={8} required className="field" />
              <p className="text-xs text-muted">Member should change this on first login.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-secondary">Role</label>
              <select name="roleId" className="field">
                <option value="">No role (read-only)</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMemberForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Inviting…" : "Create account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role form */}
      {tab === "roles" && showRoleForm && (
        <div className="card p-5">
          <h2 className="font-medium mb-4">Create role</h2>
          <form ref={roleFormRef} onSubmit={onCreateRole} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Role name *</label>
                <input name="name" required placeholder="e.g. Sales Associate" className="field" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Description</label>
                <input name="description" placeholder="What can this role do?" className="field" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-secondary mb-2 block">Permissions *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input type="checkbox" name="permissions" value={perm} className="rounded accent-indigo-600" />
                    <span className="text-secondary group-hover:text-primary transition-colors font-mono text-xs">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRoleForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? "Creating…" : "Create role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <TableSkeleton /> : (
        <>
          {tab === "members" && (
            <div className="card overflow-hidden">
              {employees.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="font-medium">No team members yet</p>
                  <p className="text-sm text-secondary mt-1">Invite your first team member above.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Member</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300 flex items-center justify-center flex-shrink-0">
                              {initials(emp.fullName)}
                            </div>
                            <span className="font-medium">{emp.fullName}</span>
                          </div>
                        </td>
                        <td className="text-secondary text-sm">{emp.email}</td>
                        <td>
                          {emp.userRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {emp.userRoles.map((ur) => (
                                <span key={ur.role.name} className="badge text-xs" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                                  {ur.role.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted text-xs">No role</span>
                          )}
                        </td>
                        <td>
                          <span className={emp.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                            {emp.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-muted text-xs">{new Date(emp.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "roles" && (
            <div className="space-y-3">
              {roles.length === 0 ? (
                <div className="card py-16 text-center">
                  <p className="text-4xl mb-3">🔐</p>
                  <p className="font-medium">No roles defined yet</p>
                  <p className="text-sm text-secondary mt-1">Create roles to control what each team member can access.</p>
                </div>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        {role.description && <p className="text-sm text-secondary mt-0.5">{role.description}</p>}
                      </div>
                      <span className="text-xs text-muted">{role.permissions.length} permissions</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((rp) => (
                        <span key={rp.permission.key} className="badge text-xs font-mono" style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}>
                          {rp.permission.key}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
