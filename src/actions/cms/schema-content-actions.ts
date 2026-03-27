// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

// Helper function to check if richtext content is empty
const isRichTextEmpty = (value: any): boolean => {
  if (value && typeof value === "object" && value.type === "doc") {
    const content = Array.isArray(value.content) ? value.content : []

    return (
      content.length === 0 ||
      (content.length === 1 &&
        content[0]?.type === "paragraph" &&
        (!content[0]?.content || content[0].content.length === 0))
    )
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/<p><\/p>/gi, "")
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, "")
      .trim()

    return normalized.length === 0
  }

  if (!value || typeof value !== "object") return true;
  if (!value.content || !Array.isArray(value.content)) return true;
  return (
    value.content.length === 0 ||
    (value.content.length === 1 && value.content[0].type === "paragraph" && (!value.content[0].content || value.content[0].content.length === 0))
  );
};

const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

// Format content based on field type
const formatContentForFieldType = (fieldType: string, value: any): any => {
  if (fieldType === "richtext") {
    return isRichTextEmpty(value) ? null : value;
  }

  if (isEmpty(value)) {
    return null;
  }

  switch (fieldType) {
    case "text":
      return value.toString();

    case "richtext":
      // Rich text is stored as TipTap JSON.
      return value;

    case "number":
      return Number(value);

    case "boolean":
      return Boolean(value);

    case "date":
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

    case "reference":
      // Store reference as either { all: true } or { entry_ids: [...] }
      if (value?.all) {
        return { all: true };
      } else if (value?.entry_ids) {
        return { entry_ids: value.entry_ids };
      }
      return null;

    default:
      return value;
  }
};

type UpdatedSchemaContentField = {
  id: string;
  content: any;
  type: string;
  content_field_id?: string | null;
};

type SchemaSectionRow = {
  id: string;
  name: string;
  description: string | null;
  order: number | null;
};

// Updated savePageContent function that works with schema-based fields
export async function savePageContent(
  pageId: string,
  updatedFields: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const updatedFieldsArray: UpdatedSchemaContentField[] = JSON.parse(updatedFields);

  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No active tenant selected." };
    }

    if (updatedFieldsArray.length === 0) {
      return { success: true, message: "No changes to save" };
    }

    const { data: page, error: pageError } = await supabase
      .from("cms_pages")
      .select("id, website_id, cms_websites!inner(tenant_id)")
      .eq("id", pageId)
      .single();

    if (pageError || !page || page.cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Page not found or access denied." };
    }

    const schemaFieldIds = [...new Set(updatedFieldsArray.map((field) => field.id))];

    const { data: schemaFields, error: schemaFieldsError } = await supabase
      .from("cms_schema_fields")
      .select("id, schema_section_id, name, type, order, parent_field_id, collection_id")
      .in("id", schemaFieldIds);

    if (schemaFieldsError || !schemaFields) {
      return { success: false, error: schemaFieldsError?.message || "Failed to load schema fields." };
    }

    const schemaSectionIds = [...new Set(schemaFields.map((field) => field.schema_section_id))];

    const { data: schemaSections, error: schemaSectionsError } = await supabase
      .from("cms_schema_sections")
      .select("id, name, description, order")
      .in("id", schemaSectionIds);

    if (schemaSectionsError || !schemaSections) {
      return { success: false, error: schemaSectionsError?.message || "Failed to load schema sections." };
    }

    const sectionIdBySchemaSectionId = new Map<string, string>();

    const { data: existingSections, error: existingSectionsError } = await supabase
      .from("cms_content_sections")
      .select("id, schema_section_id")
      .eq("page_id", pageId)
      .in("schema_section_id", schemaSectionIds);

    if (existingSectionsError) {
      return { success: false, error: existingSectionsError.message };
    }

    for (const section of existingSections || []) {
      if (section.schema_section_id) {
        sectionIdBySchemaSectionId.set(section.schema_section_id, section.id);
      }
    }

    const missingSections = (schemaSections as SchemaSectionRow[]).filter(
      (section) => !sectionIdBySchemaSectionId.has(section.id)
    );

    if (missingSections.length > 0) {
      const { data: insertedSections, error: insertSectionsError } = await supabase
        .from("cms_content_sections")
        .insert(
          missingSections.map((section) => ({
            page_id: pageId,
            schema_section_id: section.id,
            name: section.name,
            description: section.description,
            order: section.order || 0,
          }))
        )
        .select("id, schema_section_id");

      if (insertSectionsError) {
        return { success: false, error: insertSectionsError.message };
      }

      for (const section of insertedSections || []) {
        if (section.schema_section_id) {
          sectionIdBySchemaSectionId.set(section.schema_section_id, section.id);
        }
      }
    }

    const contentSectionIds = [...sectionIdBySchemaSectionId.values()];
    const { data: existingFields, error: existingFieldsError } = await supabase
      .from("cms_content_fields")
      .select("id, section_id, schema_field_id")
      .in("section_id", contentSectionIds)
      .in("schema_field_id", schemaFieldIds);

    if (existingFieldsError) {
      return { success: false, error: existingFieldsError.message };
    }

    const existingBySectionAndSchemaField = new Map<string, string>();
    for (const field of existingFields || []) {
      existingBySectionAndSchemaField.set(`${field.section_id}:${field.schema_field_id}`, field.id);
    }

    const schemaFieldById = new Map(schemaFields.map((field) => [field.id, field]));

    for (const field of updatedFieldsArray) {
      const schemaField = schemaFieldById.get(field.id);
      if (!schemaField) continue;

      const sectionId = sectionIdBySchemaSectionId.get(schemaField.schema_section_id);
      if (!sectionId) continue;

      const existingId = existingBySectionAndSchemaField.get(`${sectionId}:${field.id}`);
      const formattedContent = formatContentForFieldType(field.type, field.content);

      const payload: Database["public"]["Tables"]["cms_content_fields"]["Insert"] = {
        id: field.content_field_id || existingId || undefined,
        section_id: sectionId,
        schema_field_id: field.id,
        collection_id: schemaField.collection_id,
        name: schemaField.name,
        type: schemaField.type,
        order: schemaField.order || 0,
        parent_field_id: schemaField.parent_field_id,
        content: formattedContent,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("cms_content_fields").upsert(payload, { onConflict: "id" });
      if (error) {
        console.error(`Error saving field ${field.id}:`, error);
        return { success: false, error: error.message };
      }
    }

    // Revalidate the page to ensure fresh data
    revalidatePath(`/dashboard/pages/${pageId}`);
    revalidatePath(`/dashboard/websites`);

    return { success: true, message: "Content saved successfully" };
  } catch (error) {
    console.error("Error saving content:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save content" };
  }
}

// Function to initialize content when schema is assigned
export async function initializePageContent(schemaId: string) {
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
    const { error, data } = await supabase.rpc("sync_schema_changes", {
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
