"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { revalidatePath } from "next/cache";

export interface TenantSearchResult {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

export async function searchTenants(
  query: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ tenants: TenantSearchResult[]; hasMore: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tenants: [], hasMore: false };

  const hasPermission = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!hasPermission) return { tenants: [], hasMore: false };

  const from = (page - 1) * pageSize;
  const to = from + pageSize; // fetch one extra to check hasMore

  let dbQuery = supabaseAdmin
    .from("tenants")
    .select("id, name, logo_url, website")
    .order("name", { ascending: true })
    .range(from, to);

  if (query.trim()) {
    dbQuery = dbQuery.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await dbQuery;

  if (error || !data) return { tenants: [], hasMore: false };

  const hasMore = data.length > pageSize;
  const tenants = data.slice(0, pageSize);

  revalidatePath("/dashboard", "layout")

  return { tenants, hasMore };
}
