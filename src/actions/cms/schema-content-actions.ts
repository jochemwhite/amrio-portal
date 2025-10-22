"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { revalidatePath } from "next/cache";

// Helper function to check if a value is empty
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

// Helper function to check if richtext content is empty
const isRichTextEmpty = (value: any): boolean => {
  if (!value || typeof value !== "object") return true;
  if (!value.content || !Array.isArray(value.content)) return true;
  return (
    value.content.length === 0 ||
    (value.content.length === 1 && value.content[0].type === "paragraph" && (!value.content[0].content || value.content[0].content.length === 0))
  );
};

// Format content based on field type
const formatContentForFieldType = (fieldType: string, value: any): any => {
  if (fieldType === "richtext") {
    return isRichTextEmpty(value) ? null : value;
  } else if (isEmpty(value)) {
    return null;
  }

  switch (fieldType) {
    case "text":
      return value.toString();

    case "richtext":
      // Rich text is stored as-is (JSON object)
      return value;

    case "number":
      return Number(value);

    case "boolean":
      return Boolean(value);

    case "date":
      // Store date as ISO string
      return new Date(value).toISOString();

    case "image":
      // Store image data as object
      return {
        url: value.url || value,
        alt: value.alt || "",
        caption: value.caption || "",
      };

    case "video":
      // Store video data as object
      return {
        url: value.url || value,
        title: value.title || "",
        description: value.description || "",
      };

    case "collection":
      // Store collection reference
      return {
        collection_id: value.collection_id || value,
        entry_id: value.entry_id || null,
      };

    default:
      return { value: value };
  }
};

// Updated savePageContent function that works with schema-based fields
export async function savePageContent(
  updatedFields: Array<{
    id: string; // schema field ID
    content: any;
    type: string;
    content_field_id?: string | null; // actual content field ID
  }>
) {
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

    if (updatedFields.length === 0) {
      return { success: true, message: "No changes to save" };
    }

    // Process each updated field
    const updatePromises = updatedFields.map(async (field) => {
      const { id: schemaFieldId, content: value, type: fieldType, content_field_id } = field;

      // Format the content based on field type
      const formattedContent = formatContentForFieldType(fieldType, value);

      // Update using content_field_id if available (for existing content)
      // Otherwise use schema_field_id to find the content field
      let query = supabase.from("cms_content_fields").update({ content: formattedContent, updated_at: new Date().toISOString() });

      if (content_field_id) {
        // Update by content field ID (most direct method)
        query = query.eq("id", content_field_id);
      } else {
        // Update by schema field ID (fallback for new content)
        query = query.eq("schema_field_id", schemaFieldId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error saving field ${schemaFieldId}:`, error);
        throw error;
      }

      return data;
    });

    await Promise.all(updatePromises);

    // Revalidate the page to ensure fresh data
    revalidatePath(`/dashboard/websites`);

    return { success: true, message: "Content saved successfully" };
  } catch (error) {
    console.error("Error saving content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to save content");
  }
}

// Function to initialize content when schema is assigned
export async function initializePageContent(pageId: string, schemaId: string) {
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

    // Call the new RPC function to initialize page content structure
    const { error } = await supabase.rpc("initialize_page_content", {
      page_id_param: pageId,
      schema_id_param: schemaId,
    });

    if (error) {
      console.error("Error calling initialize_page_content:", error);
      throw error;
    }

    // Revalidate the page
    revalidatePath(`/dashboard/websites`);

    return { success: true, message: "Content initialized successfully" };
  } catch (error) {
    console.error("Error initializing content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to initialize content");
  }
}

// Function to get schema change information
export async function getSchemaChangeInfo(pageId: string) {
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

    // For now, return a simple check using direct queries
    // This will be replaced with the RPC function once it's deployed
    const { data: page, error } = await supabase
      .from("cms_pages")
      .select(
        `
        id,
        created_at,
        cms_schemas!inner(
          id,
          name,
          updated_at
        )
      `
      )
      .eq("id", pageId)
      .single();

    if (error) {
      throw error;
    }

    if (!page) {
      return null;
    }

    const schema = page.cms_schemas;
    const schemaUpdatedAfterPage = schema.updated_at && page.created_at ? new Date(schema.updated_at) > new Date(page.created_at) : false;

    return {
      has_schema: true,
      schema_updated_after_page: schemaUpdatedAfterPage,
      schema_name: schema.name,
      schema_updated_at: schema.updated_at,
      page_created_at: page.created_at,
    };
  } catch (error) {
    console.error("Error getting schema change info:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get schema change info");
  }
}

// Function to sync schema changes
export async function syncSchemaChanges(pageId: string) {
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

    // First get the page to find its schema
    const { data: page, error: pageError } = await supabase.from("cms_pages").select("schema_id").eq("id", pageId).single();

    if (pageError || !page?.schema_id) {
      throw new Error("Page or schema not found");
    }

    // For now, just update the page's schema_id
    // This will be replaced with the RPC function once it's deployed
    const { error } = await supabase.from("cms_pages").update({ schema_id: page.schema_id }).eq("id", pageId);

    if (error) {
      throw error;
    }

    // Revalidate the page
    revalidatePath(`/dashboard/websites`);

    return { success: true, message: "Schema changes synced successfully" };
  } catch (error) {
    console.error("Error syncing schema changes:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to sync schema changes");
  }
}
