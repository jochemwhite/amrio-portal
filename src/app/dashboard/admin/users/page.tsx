import type { Metadata } from "next";

import { getUserRoleOptions, getUsers } from "@/app/actions/users";
import { UserTable } from "@/components/admin/UserTable";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage user invites, roles, and account status.",
};

export default async function AdminUsersPage() {
  const [result, roleOptionsResult] = await Promise.all([getUsers(), getUserRoleOptions()]);
  const roleOptions = roleOptionsResult.data ?? [];




  return (
    <div className="container mx-auto space-y-6 py-6">
      {result.success ? (
        <UserTable
          initialUsers={result.data ?? []}
          roleOptions={roleOptions}
        />
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h1 className="text-lg font-semibold">User Management</h1>
          <p className="mt-2 text-sm text-destructive">
            Failed to load users: {result.error}
          </p>
        </div>
      )}
    </div>
  );
}
