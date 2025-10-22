"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

type Website = Database["public"]["Tables"]["cms_websites"]["Row"];

interface CreateWebsiteData {
  tenant_id: string;
  name: string;
  domain: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

interface UpdateWebsiteData {
  name?: string;
  domain?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export async function createWebsite(data: CreateWebsiteData): Promise<ActionResponse<Website>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create websites." };
  }

  try {
    const { data: website, error } = await supabase
      .from("cms_websites")
      .insert({
        tenant_id: data.tenant_id,
        name: data.name,
        domain: data.domain,
        description: data.description,
        status: data.status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating website:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/websites");
    return { success: true, data: website as Website };
  } catch (error) {
    console.error("Unexpected error creating website:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateWebsite(id: string, data: UpdateWebsiteData): Promise<ActionResponse<Website>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update websites." };
  }

  try {
    const { data: website, error } = await supabase
      .from("cms_websites")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating website:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/websites");
    return { success: true, data: website as Website };
  } catch (error) {
    console.error("Unexpected error updating website:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteWebsite(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete websites." };
  }

  try {
    const { error } = await supabase
      .from("cms_websites")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting website:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/websites");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting website:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getWebsitesByTenant(tenantId: string): Promise<ActionResponse<Website[]>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: websites, error } = await supabase
      .from("cms_websites")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching websites:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: websites as Website[] };
  } catch (error) {
    console.error("Unexpected error fetching websites:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllWebsites(): Promise<ActionResponse<Website[]>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can view all websites." };
  }

  try {
    const { data: websites, error } = await supabase
      .from("cms_websites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all websites:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: websites as Website[] };
  } catch (error) {
    console.error("Unexpected error fetching all websites:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
} 