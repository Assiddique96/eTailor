"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateMemberModal } from "@/components/team/create-member-modal";
import { CreateRoleModal } from "@/components/team/create-role-modal";

type Employee = {
  id: string; fullName: string; email: string;
  isActive: boolean; createdAt: string;
  userRoles: Array<{ role: { name: string } }>;
};
type Role = {
  id: string; name: string; description?: string;
  permissions: Array<{ permission: { key: string } }>;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function TeamPage() {
  const [tab, setTab] = useState<"members" | "roles">("members");
  const [showMember, setShowMember] = useState(false);
  const [showRole, setShowRole] = useState(false);

  const { data: usersData, isLoading: usersLoading, mutate: mutateUsers } =
    useSWR<{ users: Employee[] }>("/api/users", fetcher);
  const { data: rolesData, isLoading: rolesLoading, mutate: mutateRoles } =
    useSWR<{ roles: Role[] }>("/api/roles", fetcher);

  const employees = usersData?.users ?? [];
  const roles = rolesData?.roles ?? [];
  const loading = usersLoading || rolesLoading;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        subtitle={`${employees.length} member${employees.length !== 1 ? "s" : ""}`}
        actions={
          <>
            {tab === "members" && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMember(true)}>
                + Invite member
              </button>
            )}
            {tab === "roles" && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowRole(true)}>
                + New role
              </button>
            )}
          </>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }} role="tablist">
        {(["members", "roles"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? "border-indigo-500 text-brand" : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          {/* Members tab */}
          {tab === "members" && (
            <div className="card overflow-hidden">
              {employees.length === 0 ? (
                <EmptyState icon="👥" title="No team members yet" description="Invite your first team member above." />
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
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                              style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
                              aria-hidden
                            >
                              {initials(emp.fullName)}
                            </div>
                            <span className="font-medium">{emp.fullName}</span>
                          </div>
                        </td>
                        <td className="text-secondary text-sm">{emp.email}</td>
                        <td>
                          {emp.userRoles?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {emp.userRoles.map((ur) => (
                                <span
                                  key={ur.role.name}
                                  className="badge text-xs"
                                  style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                                >
                                  {ur.role.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted text-xs">No role</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={emp.isActive ? "DELIVERED" : "CANCELLED"} />
                        </td>
                        <td className="text-muted text-xs">
                          {new Date(emp.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Roles tab */}
          {tab === "roles" && (
            <div className="space-y-3">
              {roles.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon="🔐"
                    title="No roles defined yet"
                    description="Create roles to control what each team member can access."
                  />
                </div>
              ) : roles.map((role) => (
                <div key={role.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-secondary mt-0.5">{role.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted flex-shrink-0">
                      {role.permissions.length} permissions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((rp) => (
                      <span
                        key={rp.permission.key}
                        className="badge text-xs font-mono"
                        style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
                      >
                        {rp.permission.key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <CreateMemberModal
        open={showMember}
        onClose={() => setShowMember(false)}
        roles={roles}
        onCreated={() => mutateUsers()}
      />
      <CreateRoleModal
        open={showRole}
        onClose={() => setShowRole(false)}
        onCreated={() => mutateRoles()}
      />
    </div>
  );
}
