import { notFound } from "next/navigation";

import {
  getTenantOptions,
  getUserAuditLogs,
  getUserById,
  getUserGlobalRoles,
  getUserRoleOptions,
  getUserSessions,
  getUserTenants,
} from "@/app/actions/users";
import { UserDetailHeader } from "@/components/admin/user-detail/UserDetailHeader";
import { UserDetailTabs } from "@/components/admin/user-detail/UserDetailTabs";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const [userResult, tenantsResult, globalRolesResult, roleOptionsResult, tenantOptionsResult, auditLogsResult, sessionsResult] =
    await Promise.all([
      getUserById(userId),
      getUserTenants(userId),
      getUserGlobalRoles(userId),
      getUserRoleOptions(),
      getTenantOptions(),
      getUserAuditLogs(userId, 1, { actorMode: "both" }),
      getUserSessions(userId),
    ]);

  if (!userResult.success || !userResult.data) {
    notFound();
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <UserDetailHeader user={userResult.data} />
      <UserDetailTabs
        user={userResult.data}
        tenants={tenantsResult.data ?? []}
        globalRoles={globalRolesResult.data ?? []}
        roleOptions={roleOptionsResult.data ?? []}
        tenantOptions={tenantOptionsResult.data ?? []}
        auditLogs={auditLogsResult.data ?? { items: [], total: 0, page: 1, pageSize: 20, eventTypes: [] }}
        sessions={sessionsResult.data ?? []}
        sessionsError={sessionsResult.success ? undefined : sessionsResult.error}
      />
    </div>
  );
}
