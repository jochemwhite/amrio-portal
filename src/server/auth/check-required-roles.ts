'use server';

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";

// Define a type for the data structure returned by the Supabase query
interface UserRoleQueryResult {
  global_role_types: {
    role_name: string;
  } | null;
}

export async function checkRequiredRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_global_roles')
    .select('global_role_types(role_name)')
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching user roles for ID:", userId, error);
    return false;
  }

  if (!data || data.length === 0) {
    return false; // User has no roles at all
  }

  const userRoles: string[] = data
    .map((item: UserRoleQueryResult) => item.global_role_types?.role_name)
    .filter((roleName): roleName is string => typeof roleName === 'string');

  // --- MODIFIED LINE HERE ---
  // Check if the user possesses AT LEAST ONE of the required roles
  return requiredRoles.some((requiredRole) => userRoles.includes(requiredRole));
}