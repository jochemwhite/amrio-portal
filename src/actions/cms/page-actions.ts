"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";
import { initializePageContent } from "./schema-content-actions";

export async function createPage(data: {
  name: string;
  description?: string;
  slug: string;
  status: "draft" | "active" | "archived";
  schema_id: string;
  website_id: string;
}): Promise<ActionResponse<Database["public"]["Tables"]["cms_pages"]["Row"]>> {
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
    return { success: false, error: "Unauthorized: Only system admins can create pages." };
  }

  try {
    const { data: page, error } = await supabase
      .from("cms_pages")
      .insert({
        ...data,
        schema_id: data.schema_id || "", // Default to empty string if not provided
        tenant_id: tenantId,
        website_id: data.website_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating page:", error);
      return { success: false, error: error.message };
    }

    // Initialize page content if a schema was selected
    if (data.schema_id && data.schema_id.trim() !== "") {
      try {
        await initializePageContent(data.schema_id);
      } catch (contentError) {
        console.error("Error initializing page content:", contentError);
        // Page was created successfully, just log the content initialization error
        // We don't want to fail the whole operation
      }
    }

    revalidatePath(`/dashboard/pages`);
    return { success: true, data: page };
  } catch (error) {
    console.error("Unexpected error creating page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updatePage(
  pageId: string,
  data: {
    name?: string;
    description?: string;
    slug?: string;
    status?: "draft" | "active" | "archived";
  }
): Promise<ActionResponse<Database["public"]["Tables"]["cms_pages"]["Row"]>> {
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
    return { success: false, error: "Unauthorized: Only admins can update pages." };
  }

  try {
    const { data: page, error } = await supabase.from("cms_pages").update(data).eq("id", pageId).select().single();

    if (error) {
      console.error("Error updating page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/pages`);
    return { success: true, data: page };
  } catch (error) {
    console.error("Unexpected error updating page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

interface DeletePageProps {
  id: string;
}

export async function deletePage({ id }: DeletePageProps): Promise<ActionResponse<void>> {
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
    return { success: false, error: "Unauthorized: Only system admins can delete pages." };
  }

  try {
    const { error } = await supabase.from("cms_pages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/pages`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getPagesByWebsiteId(website_id: string): Promise<ActionResponse<Database["public"]["Tables"]["cms_pages"]["Row"][]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const { data: pages, error: page_error } = await supabase.from("cms_pages").select("*").eq("website_id", website_id);

  if (page_error) {
    return {
      success: false,
      error: page_error.message,
    };
  }

  if (pages.length === 0 || !pages) {
    return {
      success: false,
      error: "No pages found. ",
    };
  }

  return {
    success: true,
    data: pages,
  };
}
