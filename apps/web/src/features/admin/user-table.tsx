"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date | string;
};

export function UserTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authClient.admin.listUsers({
      query: {
        limit: 50,
        ...(search && {
          searchField: "email" as const,
          searchOperator: "contains" as const,
          searchValue: search,
        }),
      },
    });
    if (res.error) {
      setError(res.error.message ?? "Failed to load users");
      return;
    }
    setUsers(res.data.users as AdminUser[]);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(userId: string, role: "user" | "admin") {
    await authClient.admin.setRole({ userId, role });
    load();
  }

  async function toggleBan(u: AdminUser) {
    if (u.banned) {
      await authClient.admin.unbanUser({ userId: u.id });
    } else {
      await authClient.admin.banUser({ userId: u.id });
    }
    load();
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search by email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search users by email"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">
                  <Select
                    value={u.role ?? "user"}
                    options={[
                      { value: "user", label: "user" },
                      { value: "admin", label: "admin" },
                    ]}
                    onValueChange={(v) => setRole(u.id, v as "user" | "admin")}
                    ariaLabel={`Role for ${u.email}`}
                  />
                </td>
                <td className="p-3">
                  {u.banned ? (
                    <span className="text-red-600">banned</span>
                  ) : (
                    <span className="text-zinc-500">active</span>
                  )}
                </td>
                <td className="p-3">
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline">
                        {u.banned ? "Unban" : "Ban"}
                      </Button>
                    }
                    title={u.banned ? "Unban user" : "Ban user"}
                    description={`${u.email} — ${
                      u.banned
                        ? "restore access for this user?"
                        : "this user will no longer be able to sign in."
                    }`}
                    confirmLabel={u.banned ? "Unban" : "Ban"}
                    onConfirm={() => toggleBan(u)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
