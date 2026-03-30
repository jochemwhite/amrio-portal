"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";
import {
  AdminUser,
  AdminUserTenantMembership,
  TenantOption,
  UserAuditLogFilters,
  UserAuditLogPage,
  UserAuthDetail,
  UserDetailProfile,
  UserGlobalRoleAssignment,
  UserIdentity,
  UserMfaFactor,
  UserRoleOption,
  UserSessionInfo,
  UserTenantDetail,
  UserStatus,
} from "@/types/user";

type UserFormPayload = {
  full_name: string;
  email: string;
  role: string;
};

type SupabaseAdminListUser = {
  id?: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  confirmed_at?: string | null;
  banned?: boolean | null;
  banned_until?: string | null;
  user_metadata?: {
    full_name?: string | null;
    role?: string | null;
  } | null;
};

type PublicUserRow = Database["public"]["Tables"]["users"]["Row"];
type UserTenantRow = Database["public"]["Tables"]["user_tenants"]["Row"];
type GlobalRoleTypeRow = Database["public"]["Tables"]["global_role_types"]["Row"];
type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
type UserGlobalRoleRow = Database["public"]["Tables"]["user_global_roles"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type AdminAuthApi = {
  getUserById: (userId: string) => Promise<{ data?: { user?: unknown } | unknown; error?: { message?: string } | null }>;
  listUserSessions?: (userId: string) => Promise<{ data?: { sessions?: unknown[] } | unknown; error?: { message?: string } | null }>;
  deleteUserIdentity?: (userId: string, identity: UserIdentity) => Promise<{ error?: { message?: string } | null }>;
  signOut: (userId: string) => Promise<{ error?: { message?: string } | null }>;
  mfa?: {
    deleteFactor?: (input: { userId: string; factorId: string }) => Promise<{ error?: { message?: string } | null }>;
  };
};

const ADMIN_USERS_PATH = "/dashboard/admin/users";
const FALLBACK_ROLE_OPTIONS: UserRoleOption[] = [
  { value: "admin", label: "Admin", description: null },
  { value: "editor", label: "Editor", description: null },
  { value: "viewer", label: "Viewer", description: null },
];
const AUDIT_PAGE_SIZE = 20;

async function ensureAdminAccess(): Promise<ActionResponse<null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);

  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can manage users." };
  }

  return { success: true, data: null };
}

async function getTenantContext(): Promise<ActionResponse<{ tenantId: string }>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  return {
    success: true,
    data: {
      tenantId,
    },
  };
}

function deriveUserStatus(user: SupabaseAdminListUser): UserStatus {
  if (user.banned === true || Boolean(user.banned_until)) {
    return "suspended";
  }

  if (!user.confirmed_at) {
    return "pending";
  }

  return "active";
}

function mapGlobalRole(value: string | null | undefined): string {
  return value?.trim() || "user";
}

function splitFullName(fullName: string): { first_name: string; last_name: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first_name = parts[0] ?? "";
  const last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;

  return { first_name, last_name };
}

function buildFullName(user: Pick<PublicUserRow, "first_name" | "last_name" | "email">) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.email;
}

function sortTenantMemberships(
  memberships: AdminUserTenantMembership[],
): AdminUserTenantMembership[] {
  return [...memberships].sort((left, right) => {
    if (left.is_current_tenant && !right.is_current_tenant) {
      return -1;
    }

    if (!left.is_current_tenant && right.is_current_tenant) {
      return 1;
    }

    return left.tenant_name.localeCompare(right.tenant_name);
  });
}

function getTenantName(
  tenant:
    | Pick<TenantRow, "id" | "name">
    | Pick<TenantRow, "id" | "name">[]
    | null
    | undefined,
) {
  if (Array.isArray(tenant)) {
    return tenant[0]?.name ?? "No tenant";
  }

  return tenant?.name ?? "No tenant";
}

function mapMergedUser(
  user: PublicUserRow,
  tenantMemberships: AdminUserTenantMembership[],
  globalRoles: string[],
  authUser?: SupabaseAdminListUser,
): AdminUser {
  const sortedMemberships = sortTenantMemberships(tenantMemberships);
  const primaryMembership = sortedMemberships[0] ?? null;
  const currentMembership = sortedMemberships.find((membership) => membership.is_current_tenant) ?? null;
  const effectiveMembership = currentMembership ?? primaryMembership;
  const tenantRole = effectiveMembership?.role ?? "viewer";
  const effectiveGlobalRole = globalRoles[0] ?? "viewer";

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: buildFullName(user),
    avatar: user.avatar,
    role: mapGlobalRole(effectiveGlobalRole),
    status: authUser ? deriveUserStatus(authUser) : "pending",
    last_sign_in_at: authUser?.last_sign_in_at ?? null,
    created_at: user.created_at,
    is_onboarded: user.is_onboarded,
    tenant_role: tenantRole,
    global_roles: globalRoles,
    primary_tenant_name: effectiveMembership?.tenant_name ?? null,
    is_in_current_tenant: currentMembership !== null,
    tenant_memberships: sortedMemberships,
  };
}

function revalidateUserPages() {
  revalidatePath(ADMIN_USERS_PATH);
  revalidatePath("/admin/users");
}

function getAdminApi() {
  return supabaseAdmin.auth.admin as unknown as AdminAuthApi;
}

function mapIdentity(identity: Record<string, unknown>): UserIdentity {
  return {
    id: typeof identity.id === "string" ? identity.id : undefined,
    provider: typeof identity.provider === "string" ? identity.provider : "unknown",
    created_at: typeof identity.created_at === "string" ? identity.created_at : null,
    last_sign_in_at: typeof identity.last_sign_in_at === "string" ? identity.last_sign_in_at : null,
    identity_data:
      identity.identity_data && typeof identity.identity_data === "object"
        ? (identity.identity_data as Record<string, unknown>)
        : null,
  };
}

function mapMfaFactor(factor: Record<string, unknown>): UserMfaFactor {
  return {
    id: typeof factor.id === "string" ? factor.id : "",
    factor_type: typeof factor.factor_type === "string" ? factor.factor_type : "unknown",
    status: typeof factor.status === "string" ? factor.status : null,
    friendly_name: typeof factor.friendly_name === "string" ? factor.friendly_name : null,
    created_at: typeof factor.created_at === "string" ? factor.created_at : null,
  };
}

function mapAuthDetail(user: Record<string, unknown>): UserAuthDetail {
  return {
    banned: Boolean(user.banned) || Boolean(user.banned_until),
    banned_until: typeof user.banned_until === "string" ? user.banned_until : null,
    confirmed_at: typeof user.confirmed_at === "string" ? user.confirmed_at : null,
    email_confirmed_at:
      typeof user.email_confirmed_at === "string"
        ? user.email_confirmed_at
        : typeof user.confirmed_at === "string"
          ? user.confirmed_at
          : null,
    last_sign_in_at: typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : null,
    phone: typeof user.phone === "string" ? user.phone : null,
    created_at: typeof user.created_at === "string" ? user.created_at : null,
    identities: Array.isArray(user.identities)
      ? user.identities
          .filter((identity): identity is Record<string, unknown> => typeof identity === "object" && identity !== null)
          .map(mapIdentity)
      : [],
    mfa_factors: Array.isArray(user.factors)
      ? user.factors
          .filter((factor): factor is Record<string, unknown> => typeof factor === "object" && factor !== null)
          .map(mapMfaFactor)
      : Array.isArray(user.mfa_factors)
        ? user.mfa_factors
            .filter((factor): factor is Record<string, unknown> => typeof factor === "object" && factor !== null)
            .map(mapMfaFactor)
        : [],
  };
}

export async function getUsers(): Promise<ActionResponse<AdminUser[]>> {
  const context = await getTenantContext();

  if (!context.success || !context.data) {
    return { success: false, error: context.error };
  }

  const tenantId = context.data.tenantId;

  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        avatar,
        created_at,
        is_onboarded
      `);

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    const { data: userTenants, error: userTenantsError } = await supabaseAdmin
      .from("user_tenants")
      .select(`
        user_id,
        tenant_id,
        role,
        tenants(
          id,
          name
        )
      `);

    if (userTenantsError) {
      return { success: false, error: userTenantsError.message };
    }



    const { data: userGlobalRoles, error: userGlobalRolesError } = await supabaseAdmin
      .from("user_global_roles")
      .select(`
        user_id,
        global_role_types(
          role_name
        )
      `);

    if (userGlobalRolesError) {
      return { success: false, error: userGlobalRolesError.message };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    } as never);

    if (authError) {
      return { success: false, error: authError.message };
    }

    const authUsersById = new Map(
      ((authData?.users ?? []) as SupabaseAdminListUser[]).map((user) => [user.id, user]),
    );

    const membershipsByUserId = new Map<string, AdminUserTenantMembership[]>();
    const globalRolesByUserId = new Map<string, string[]>();

    (
      (userTenants ?? []) as unknown as (Pick<UserTenantRow, "user_id" | "tenant_id" | "role"> & {
        tenants:
          | Pick<TenantRow, "id" | "name">
          | Pick<TenantRow, "id" | "name">[]
          | null;
      })[]
    ).forEach((membership) => {
      const list = membershipsByUserId.get(membership.user_id) ?? [];

      list.push({
        tenant_id: membership.tenant_id,
        tenant_name: getTenantName(membership.tenants),
        role: membership.role ?? "viewer",
        is_current_tenant: membership.tenant_id === tenantId,
      });

      membershipsByUserId.set(membership.user_id, list);
    });

    (
      (userGlobalRoles ?? []) as unknown as (Pick<UserGlobalRoleRow, "user_id"> & {
        global_role_types:
          | Pick<GlobalRoleTypeRow, "role_name">
          | Pick<GlobalRoleTypeRow, "role_name">[]
          | null;
      })[]
    ).forEach((assignment) => {
      const normalizedRoles = Array.isArray(assignment.global_role_types)
        ? assignment.global_role_types
        : assignment.global_role_types
          ? [assignment.global_role_types]
          : [];
      const roleNames = normalizedRoles.map((role) => role.role_name);
      const list = globalRolesByUserId.get(assignment.user_id) ?? [];

      globalRolesByUserId.set(assignment.user_id, [...list, ...roleNames]);
    });

    const mergedUsers = ((users ?? []) as PublicUserRow[])
      .map((user) =>
        mapMergedUser(
          user,
          membershipsByUserId.get(user.id) ?? [],
          globalRolesByUserId.get(user.id) ?? [],
          authUsersById.get(user.id),
        ),
      )
      .sort((left, right) => left.full_name.localeCompare(right.full_name));

    return { success: true, data: mergedUsers };
  } catch (error) {
    console.error("Failed to fetch users", error);
    return { success: false, error: "Failed to fetch users." };
  }
}

export async function inviteUser(
  payload: UserFormPayload,
): Promise<ActionResponse<null>> {
  const context = await getTenantContext();

  if (!context.success || !context.data) {
    return { success: false, error: context.error };
  }

  try {
    const { first_name, last_name } = splitFullName(payload.full_name);
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.email,
      {
        data: {
          first_name,
          last_name,
          role: payload.role,
        },
      },
    );

    if (error || !data.user) {
      return { success: false, error: error?.message ?? "Failed to invite user." };
    }

    const { error: profileError } = await supabaseAdmin
      .from("users")
      .update({
        first_name,
        last_name,
      })
      .eq("id", data.user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const { error: membershipError } = await supabaseAdmin
      .from("user_tenants")
      .insert({
        user_id: data.user.id,
        tenant_id: context.data.tenantId,
        role: payload.role,
      });

    if (membershipError) {
      return { success: false, error: membershipError.message };
    }

    revalidateUserPages();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to invite user", error);
    return { success: false, error: "Failed to invite user." };
  }
}

export async function updateUser(
  id: string,
  payload: UserFormPayload,
): Promise<ActionResponse<null>> {
  const context = await getTenantContext();

  if (!context.success || !context.data) {
    return { success: false, error: context.error };
  }

  try {
    const { first_name, last_name } = splitFullName(payload.full_name);

    const { error: usersError } = await supabaseAdmin
      .from("users")
      .update({
        first_name,
        last_name,
      })
      .eq("id", id);

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    const { error: tenantError } = await supabaseAdmin
      .from("user_tenants")
      .update({
        role: payload.role,
      })
      .eq("user_id", id)
      .eq("tenant_id", context.data.tenantId);

    if (tenantError) {
      return { success: false, error: tenantError.message };
    }

    revalidateUserPages();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to update user", error);
    return { success: false, error: "Failed to update user." };
  }
}

export async function deleteUser(id: string): Promise<ActionResponse<null>> {
  const context = await getTenantContext();

  if (!context.success) {
    return { success: false, error: context.error };
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from("user_tenants").delete().eq("user_id", id);

    revalidateUserPages();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to delete user", error);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function resetPassword(email: string): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return access;
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to reset password", error);
    return { success: false, error: "Failed to generate reset password email." };
  }
}

export async function resendInvite(
  payload: UserFormPayload,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return access;
  }

  try {
    const { first_name, last_name } = splitFullName(payload.full_name);
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(payload.email, {
      data: {
        first_name,
        last_name,
        role: payload.role,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateUserPages();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to resend invite", error);
    return { success: false, error: "Failed to resend invite." };
  }
}

export async function toggleSuspend(
  id: string,
  banned: boolean,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return access;
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { ban_duration: banned ? "876600h" : "none" } as never,
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateUserPages();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to toggle suspension", error);
    return { success: false, error: "Failed to update user status." };
  }
}

export async function getUserRoleOptions(): Promise<ActionResponse<UserRoleOption[]>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error, data: FALLBACK_ROLE_OPTIONS };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("global_role_types")
      .select("id, role_name, description")
      .order("role_name", { ascending: true });

    if (error || !data?.length) {
      return {
        success: false,
        error: error?.message ?? "Failed to fetch role options.",
        data: FALLBACK_ROLE_OPTIONS,
      };
    }

    const roles = (data as GlobalRoleTypeRow[]).map((role) => ({
      value: role.role_name,
      label: role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1),
      description: role.description,
    }));

    return { success: true, data: roles };
  } catch (error) {
    console.error("Failed to fetch role options", error);
    return {
      success: false,
      error: "Failed to fetch role options.",
      data: FALLBACK_ROLE_OPTIONS,
    };
  }
}

export async function getUserById(userId: string): Promise<ActionResponse<UserDetailProfile | null>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, avatar, created_at, is_onboarded")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return { success: false, error: userError.message };
    }

    if (!user) {
      return { success: true, data: null };
    }

    const [tenantsResult, rolesResult] = await Promise.all([
      getUserTenants(userId),
      getUserGlobalRoles(userId),
    ]);

    const adminApi = getAdminApi();
    const { data: authResponse, error: authError } = await adminApi.getUserById(userId);

    if (authError) {
      return { success: false, error: authError.message };
    }

    const authUser =
      authResponse && typeof authResponse === "object" && "user" in authResponse
        ? (authResponse as { user?: Record<string, unknown> }).user ?? {}
        : (authResponse as Record<string, unknown> | undefined) ?? {};
    const tenantMemberships: AdminUserTenantMembership[] = (tenantsResult.data ?? []).map((tenant) => ({
      tenant_id: tenant.tenant_id,
      tenant_name: tenant.tenant_name,
      role: tenant.role,
      is_current_tenant: false,
    }));
    const globalRoles = (rolesResult.data ?? []).map((role) => role.role_name);

    return {
      success: true,
      data: {
        ...mapMergedUser(user as PublicUserRow, tenantMemberships, globalRoles, authUser),
        auth: mapAuthDetail(authUser),
      },
    };
  } catch (error) {
    console.error("Failed to fetch user by id", error);
    return { success: false, error: "Failed to fetch user details." };
  }
}

export async function getUserTenants(userId: string): Promise<ActionResponse<UserTenantDetail[]>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_tenants")
      .select(`
        id,
        tenant_id,
        role,
        created_at,
        tenants(
          id,
          name,
          logo_url
        )
      `)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    const tenants = ((data ?? []) as unknown as Array<{
      id: string;
      tenant_id: string;
      role: string | null;
      created_at: string | null;
      tenants: { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[] | null;
    }>).map((membership) => {
      const tenant = Array.isArray(membership.tenants) ? membership.tenants[0] : membership.tenants;

      return {
        id: membership.id,
        tenant_id: membership.tenant_id,
        tenant_name: tenant?.name ?? "No tenant",
        tenant_logo_url: tenant?.logo_url ?? null,
        role: membership.role ?? "viewer",
        created_at: membership.created_at,
      };
    });

    return { success: true, data: tenants };
  } catch (error) {
    console.error("Failed to fetch user tenants", error);
    return { success: false, error: "Failed to fetch user tenants." };
  }
}

export async function getUserGlobalRoles(userId: string): Promise<ActionResponse<UserGlobalRoleAssignment[]>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_global_roles")
      .select(`
        id,
        user_id,
        global_role_type_id,
        created_at,
        global_role_types(
          role_name,
          description
        )
      `)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    const roles = ((data ?? []) as unknown as Array<{
      id: string;
      global_role_type_id: string;
      created_at: string | null;
      global_role_types:
        | { role_name: string; description: string | null }
        | { role_name: string; description: string | null }[]
        | null;
    }>).map((assignment) => {
      const roleType = Array.isArray(assignment.global_role_types)
        ? assignment.global_role_types[0]
        : assignment.global_role_types;

      return {
        id: assignment.id,
        global_role_type_id: assignment.global_role_type_id,
        role_name: roleType?.role_name ?? "user",
        description: roleType?.description ?? null,
        created_at: assignment.created_at,
      };
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error("Failed to fetch user global roles", error);
    return { success: false, error: "Failed to fetch user global roles." };
  }
}

export async function getUserAuditLogs(
  userId: string,
  page = 1,
  filters: UserAuditLogFilters = {},
): Promise<ActionResponse<UserAuditLogPage>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }

    if (filters.actorMode === "actor") {
      query = query.eq("user_id", userId);
    }

    if (filters.actorMode === "subject") {
      query = query.eq("target_user_id", userId);
    }

    if (filters.from) {
      query = query.gte("created_at", filters.from);
    }

    if (filters.to) {
      query = query.lte("created_at", filters.to);
    }

    const from = (page - 1) * AUDIT_PAGE_SIZE;
    const to = from + AUDIT_PAGE_SIZE - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: eventTypesData } = await supabaseAdmin
      .from("audit_logs")
      .select("event_type")
      .or(`user_id.eq.${userId},target_user_id.eq.${userId}`);

    const eventTypes = [
      ...new Set(
        ((eventTypesData ?? []) as Array<{ event_type: string | null }>)
          .map((item) => item.event_type)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort();

    return {
      success: true,
      data: {
        items: (data ?? []) as AuditLogRow[],
        total: count ?? 0,
        page,
        pageSize: AUDIT_PAGE_SIZE,
        eventTypes,
      },
    };
  } catch (error) {
    console.error("Failed to fetch audit logs", error);
    return { success: false, error: "Failed to fetch audit logs." };
  }
}

export async function getUserSessions(userId: string): Promise<ActionResponse<UserSessionInfo[]>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    const adminApi = getAdminApi();

    if (typeof adminApi.listUserSessions !== "function") {
      return {
        success: false,
        error: "Session data requires Supabase project access.",
        data: [],
      };
    }

    const { data, error } = await adminApi.listUserSessions(userId);

    if (error) {
      return {
        success: false,
        error: error.message || "Session data requires Supabase project access.",
        data: [],
      };
    }

    const rawSessions = Array.isArray((data as { sessions?: unknown[] } | undefined)?.sessions)
      ? ((data as { sessions?: unknown[] }).sessions ?? [])
      : Array.isArray(data)
        ? data
        : [];

    const sessions = rawSessions
      .filter((session): session is Record<string, unknown> => typeof session === "object" && session !== null)
      .map((session) => ({
        id:
          typeof session.id === "string"
            ? session.id
            : typeof session.session_id === "string"
              ? session.session_id
              : crypto.randomUUID(),
        ip_address: typeof session.ip_address === "string" ? session.ip_address : null,
        user_agent: typeof session.user_agent === "string" ? session.user_agent : null,
        created_at: typeof session.created_at === "string" ? session.created_at : null,
        updated_at:
          typeof session.updated_at === "string"
            ? session.updated_at
            : typeof session.last_refreshed_at === "string"
              ? session.last_refreshed_at
              : null,
      }));

    return { success: true, data: sessions };
  } catch (error: unknown) {
    console.error("Failed to fetch user sessions", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Session data requires Supabase project access.",
      data: [],
    };
  }
}

export async function getTenantOptions(): Promise<ActionResponse<TenantOption[]>> {
  const access = await ensureAdminAccess();

  if (!access.success) {
    return { success: false, error: access.error };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, logo_url")
      .order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data ?? []) as TenantOption[] };
  } catch (error) {
    console.error("Failed to fetch tenant options", error);
    return { success: false, error: "Failed to fetch tenant options." };
  }
}

export async function assignUserToTenant(
  userId: string,
  tenantId: string,
  role: string,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("user_tenants")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existingError) return { success: false, error: existingError.message };
    if (existing) return { success: false, error: "User is already assigned to that tenant." };

    const { error } = await supabaseAdmin.from("user_tenants").insert({
      user_id: userId,
      tenant_id: tenantId,
      role,
    });

    if (error) return { success: false, error: error.message };
    revalidateUserPages();
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to assign user to tenant", error);
    return { success: false, error: "Failed to assign user to tenant." };
  }
}

export async function removeUserFromTenant(userId: string, tenantId: string): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { error } = await supabaseAdmin
      .from("user_tenants")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };
    revalidateUserPages();
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to remove user from tenant", error);
    return { success: false, error: "Failed to remove user from tenant." };
  }
}

export async function updateUserTenantRole(
  userId: string,
  tenantId: string,
  role: string,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { error } = await supabaseAdmin
      .from("user_tenants")
      .update({ role })
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };
    revalidateUserPages();
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to update tenant role", error);
    return { success: false, error: "Failed to update tenant role." };
  }
}

export async function assignGlobalRole(
  userId: string,
  globalRoleTypeId: string,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { error } = await supabaseAdmin.from("user_global_roles").insert({
      user_id: userId,
      global_role_type_id: globalRoleTypeId,
    });

    if (error) return { success: false, error: error.message };
    revalidateUserPages();
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to assign global role", error);
    return { success: false, error: "Failed to assign global role." };
  }
}

export async function removeGlobalRole(userGlobalRoleId: string): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { error } = await supabaseAdmin.from("user_global_roles").delete().eq("id", userGlobalRoleId);
    if (error) return { success: false, error: error.message };
    revalidateUserPages();
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to remove global role", error);
    return { success: false, error: "Failed to remove global role." };
  }
}

export async function unlinkProvider(userId: string, identity: UserIdentity): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const adminApi = getAdminApi();
    if (typeof adminApi.deleteUserIdentity !== "function") {
      return { success: false, error: "Provider unlinking is not available in this project." };
    }

    const { error } = await adminApi.deleteUserIdentity(userId, identity);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to unlink provider", error);
    return { success: false, error: "Failed to unlink provider." };
  }
}

export async function deleteMfaFactor(userId: string, factorId: string): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const adminApi = getAdminApi();
    if (!adminApi.mfa || typeof adminApi.mfa.deleteFactor !== "function") {
      return { success: false, error: "MFA management is not available in this project." };
    }

    const { error } = await adminApi.mfa.deleteFactor({ userId, factorId });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to delete MFA factor", error);
    return { success: false, error: "Failed to delete MFA factor." };
  }
}

export async function revokeAllSessions(userId: string): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const adminApi = getAdminApi();
    const { error } = await adminApi.signOut(userId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to revoke sessions", error);
    return { success: false, error: "Failed to revoke sessions." };
  }
}

export async function resendVerificationEmail(email: string): Promise<ActionResponse<string>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
    } as never);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data?.properties?.action_link ?? "" };
  } catch (error) {
    console.error("Failed to resend verification email", error);
    return { success: false, error: "Failed to resend verification email." };
  }
}

export async function resetPasswordWithLink(email: string): Promise<ActionResponse<string>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data?.properties?.action_link ?? "" };
  } catch (error) {
    console.error("Failed to generate reset password link", error);
    return { success: false, error: "Failed to generate reset password link." };
  }
}
