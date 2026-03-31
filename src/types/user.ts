export type UserRole = "admin" | "editor" | "viewer";

export type UserStatus = "active" | "suspended" | "pending";

export interface AdminUserTenantMembership {
  tenant_id: string;
  tenant_name: string;
  role: string;
  is_current_tenant: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  avatar: string | null;
  role: string;
  status: UserStatus;
  last_sign_in_at: string | null;
  created_at: string;
  is_onboarded: boolean;
  tenant_role: string;
  global_roles: string[];
  primary_tenant_name: string | null;
  is_in_current_tenant: boolean;
  tenant_memberships: AdminUserTenantMembership[];
}

export interface UserRoleOption {
  value: string;
  label: string;
  description: string | null;
}

export interface TenantOption {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface UserTenantDetail {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_logo_url: string | null;
  role: string;
  created_at: string | null;
}

export interface UserGlobalRoleAssignment {
  id: string;
  global_role_type_id: string;
  role_name: string;
  description: string | null;
  created_at: string | null;
}

export interface UserIdentity {
  id?: string;
  provider: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  identity_data: Record<string, unknown> | null;
}

export interface UserMfaFactor {
  id: string;
  factor_type: string;
  status: string | null;
  friendly_name: string | null;
  created_at: string | null;
}

export interface UserSessionInfo {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserAuditLog {
  id: string;
  event_type: string;
  ip_address: string | null;
  metadata: unknown;
  created_at: string | null;
  user_id: string | null;
  target_user_id: string | null;
  user_agent: string | null;
}

export interface UserAuditLogFilters {
  eventType?: string;
  actorMode?: "both" | "actor" | "subject";
  from?: string;
  to?: string;
}

export interface UserAuditLogPage {
  items: UserAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  eventTypes: string[];
}

export interface UserAuthDetail {
  banned: boolean;
  banned_until: string | null;
  confirmed_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  phone: string | null;
  created_at: string | null;
  identities: UserIdentity[];
  mfa_factors: UserMfaFactor[];
}

export interface UserDetailProfile extends AdminUser {
  auth: UserAuthDetail;
}
