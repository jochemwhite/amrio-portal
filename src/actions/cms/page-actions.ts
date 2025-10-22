"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export async function createPage(
  data: {
    name: string;
    description?: string;
    slug: string;
    status: "draft" | "active" | "archived";
    schema_id: string;
  },
  websiteId: string
): Promise<ActionResponse<Database["public"]["Tables"]["cms_pages"]["Row"]>> {
  console.log("Creating page", websiteId);
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }
  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create pages." };
  }

  try {
    const { data: page, error } = await supabase
      .from("cms_pages")
      .insert({ ...data, website_id: websiteId, tenant_id: tenantId })
      .select()
      .single();

    if (error) {
      console.error("Error creating page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/websites/${websiteId}/pages`);
    return { success: true, data: page };
  } catch (error) {
    console.error("Unexpected error creating page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

interface DeletePageProps {
  id: string;
  websiteId: string;
}

export async function deletePage({ id, websiteId }: DeletePageProps): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete pages." };
  }

  try {
    const { error } = await supabase.from("cms_pages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/websites`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
