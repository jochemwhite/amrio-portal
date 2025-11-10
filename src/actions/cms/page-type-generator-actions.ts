"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { generateFlatPageInterface } from "@/lib/page-type-generator";
import { ActionResponse } from "@/types/actions";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";

/**
 * Type definition for get_page_content RPC response
 */
export interface PageContentField {
  id: string;
  field_key: string;
  name: string;
  type: string;
  content: any;
  order: number;
  fields?: PageContentField[]; // For nested section fields
}

export interface GetPageContentResponse {
  id: string;
  slug: string;
  sections: {
    id: string;
    name: string;
    order: number;
    fields: PageContentField[];
  }[];
}

/**
 * Generate TypeScript types for a specific page
 * Only accessible by system admins
 */
export async function generateTypesForPage(pageId: string, websiteId: string): Promise<ActionResponse<{ types: string; pageName: string }>> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user is system admin
    const isSystemAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
    if (!isSystemAdmin) {
      return {
        success: false,
        error: "Access denied. Only system administrators can generate types.",
      };
    }

    // Get page information
    const { data: page, error: pageError } = await supabase.from("cms_pages").select("id, name, slug").eq("id", pageId).single();

    if (pageError || !page) {
      return { success: false, error: "Page not found" };
    }

    // Call get_page_content RPC function to get the structured content
    const { data: pageContent, error: contentError } = await supabase.rpc("get_page_content", {
      page_id_param: pageId,
      website_id_param: websiteId,
    });

    if (contentError) {
      return { success: false, error: contentError.message };
    }

    if (!pageContent || !Array.isArray(pageContent) || pageContent.length === 0) {
      return { success: false, error: "Page content not found" };
    }

    // get_page_content returns an array with a single item
    const parsedPageContent = pageContent[0] as unknown as GetPageContentResponse;
    
    // Sort sections by order number
    const orderedSections = parsedPageContent.sections.sort((a, b) => a.order - b.order);
    
    // Sort fields within each section
    orderedSections.forEach(section => {
      section.fields.sort((a, b) => a.order - b.order);
    });

    const pageContentResponse: GetPageContentResponse = {
      ...parsedPageContent,
      sections: orderedSections,
    };
    
    // Generate the flat TypeScript interface
    const types = generateFlatPageInterface(pageContentResponse, page.name);

    return {
      success: true,
      data: {
        types,
        pageName: page.name,
      },
    };
  } catch (error) {
    console.error("Error generating page types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all pages for type generation (system admin only)
 */
export async function getPagesForTypeGeneration(): Promise<ActionResponse<Array<{ id: string; name: string; slug: string; website_id: string | null }>>> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user is system admin
    const isSystemAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
    if (!isSystemAdmin) {
      return {
        success: false,
        error: "Access denied. Only system administrators can access this feature.",
      };
    }

    // Get all pages
    const { data: pages, error } = await supabase.from("cms_pages").select("id, name, slug, website_id").order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: pages || [],
    };
  } catch (error) {
    console.error("Error fetching pages for type generation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
