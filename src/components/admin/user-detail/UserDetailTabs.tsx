"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantOption, UserAuditLogPage, UserDetailProfile, UserGlobalRoleAssignment, UserRoleOption, UserSessionInfo, UserTenantDetail } from "@/types/user";
import { UserAuditLogTab } from "./UserAuditLogTab";
import { UserOverviewTab } from "./UserOverviewTab";
import { UserProvidersTab } from "./UserProvidersTab";
import { UserSessionsTab } from "./UserSessionsTab";
import { UserTenantsTab } from "./UserTenantsTab";

export function UserDetailTabs({
  user,
  roleOptions,
  tenantOptions,
  tenants,
  globalRoles,
  auditLogs,
  sessions,
  sessionsError,
}: {
  user: UserDetailProfile;
  roleOptions: UserRoleOption[];
  tenantOptions: TenantOption[];
  tenants: UserTenantDetail[];
  globalRoles: UserGlobalRoleAssignment[];
  auditLogs: UserAuditLogPage;
  sessions: UserSessionInfo[];
  sessionsError?: string;
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tenants">Tenants & Roles</TabsTrigger>
        <TabsTrigger value="providers">Linked Providers</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <UserOverviewTab user={user} roleOptions={roleOptions} />
      </TabsContent>
      <TabsContent value="tenants">
        <UserTenantsTab
          userId={user.id}
          tenants={tenants}
          globalRoles={globalRoles}
          tenantOptions={tenantOptions}
          roleOptions={roleOptions}
        />
      </TabsContent>
      <TabsContent value="providers">
        <UserProvidersTab
          userId={user.id}
          identities={user.auth.identities}
          mfaFactors={user.auth.mfa_factors}
        />
      </TabsContent>
      <TabsContent value="sessions">
        <UserSessionsTab userId={user.id} sessions={sessions} error={sessionsError} />
      </TabsContent>
      <TabsContent value="audit">
        <UserAuditLogTab userId={user.id} initialData={auditLogs} />
      </TabsContent>
    </Tabs>
  );
}
