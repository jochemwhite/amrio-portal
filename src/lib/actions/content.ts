"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { revalidatePath } from "next/cache";

// Helper function to check if a value is empty

export async function savePageContent(contentValues: { id: string; content: any; type: string }[]) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const updatePromises = contentValues.map(async (contentValue) => {
      const { error } = await supabase
        .from("cms_fields")
        .update({ content: contentValue.content})
        .eq("id", contentValue.id);
      return error;
    });

    const errors = await Promise.all(updatePromises);

    if (errors.some((error) => error !== null)) {
      throw new Error("Failed to update fields");
    }

    // Revalidate the page to ensure fresh data
    revalidatePath(`/dashboard/websites`);

    return { success: true };
  } catch (error) {
    console.error("Error saving content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to save content");
  }
}

export async function loadPageContent(pageId: string, websiteId: string) {
  try {
    const supabase: any = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use RPC function to get page with nested sections and field content
    const { data: pageData, error } = await supabase.rpc("get_page", {
      page_id_param: pageId,
      website_id_param: websiteId,
    });

    if (error) {
      throw error;
    }

    if (!pageData || !Array.isArray(pageData) || pageData.length === 0) {
      throw new Error("Page not found");
    }

    // Extract the first (and only) page from the response array
    return pageData[0];
  } catch (error) {
    console.error("Error loading content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to load content");
  }
}
