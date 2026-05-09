"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = { id: string; name: string };
type User = { id: string; fullName: string; email: string; roles: string[] };

const PERMISSIONS = [
  "customers.read",
  "customers.write",
  "measurements.write",
  "jobs.read",
  "jobs.write",
  "jobs.assign",
  "invoices.read",
  "invoices.write",
  "payments.read",
  "payments.write",
  "reports.read",
  "settings.manage",
  "users.manage",
  "audit.read",
];

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  async function load() {
    const [uRes, rRes] = await Promise.all([fetch("/api/users"), fetch("/api/roles")]);
    const uData = await uRes.json();
    const rData = await rRes.json();
    setUsers(uData.users ?? []);
    setRoles(rData.roles ?? []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/users"), fetch("/api/roles")])
      .then(async ([uRes, rRes]) => {
        const uData = await uRes.json();
        const rData = await rRes.json();
        setUsers(uData.users ?? []);
        setRoles(rData.roles ?? []);
      });
  }, []);

  async function onCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const permissions = formData.getAll("permissions");
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        description: formData.get("description"),
        permissions,
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  async function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const roleIds = formData.getAll("roleIds");
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        roleIds,
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Team & Permissions</h2>

      <form onSubmit={onCreateRole} className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">Create Role</p>
        <input name="name" placeholder="Role name (e.g. sales-associate)" required className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="description" placeholder="Description" className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
        <div className="grid gap-2 md:grid-cols-3">
          {PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input type="checkbox" name="permissions" value={p} />
              <span>{p}</span>
            </label>
          ))}
        </div>
        <button className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700">Create Role</button>
      </form>

      <form onSubmit={onCreateUser} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <input name="fullName" placeholder="Employee name" required className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
        <input type="email" name="email" placeholder="Employee email" required className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
        <input type="password" name="password" placeholder="Temporary password" required className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
        <select name="roleIds" multiple required className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">Create Employee</button>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">{u.fullName} ({u.email})</p>
            <p className="text-zinc-600 dark:text-zinc-300">Roles: {u.roles.join(", ") || "None"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
