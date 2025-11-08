"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";
import { initializePageContent } from "./schema-content-actions";

// ============== TYPES ==============

export interface CollectionEntry {
  id: string;
  collection_id: string;
  name: string | null;
  created_at: string;
}

export interface CollectionEntryWithItems extends CollectionEntry {
  cms_collections_items?: Array<{
    id: string;
    schema_field_id: string;
    content: any;
    field_type: string | null;
    name: string | null;
    order: number;
    parent_field_id: string | null;
    created_at: string;
    updated_at: string | null;
  }>;
}

interface CreateCollectionEntryData {
  collection_id: string;
  name?: string;
}

interface UpdateCollectionEntryData {
  name?: string;
}

// ============== COLLECTION ENTRY CRUD ==============

export async function createCollectionEntry(data: CreateCollectionEntryData): Promise<ActionResponse<CollectionEntry>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Verify collection ownership and get schema_id
    const { data: collection, error: collectionError } = await supabase
      .from("cms_collections")
      .select(
        `
        id,
        schema_id,
        cms_websites!inner(tenant_id)
      `
      )
      .eq("id", data.collection_id)
      .single();

    if (collectionError || !collection || (collection as any).cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Collection not found or access denied." };
    }

    // Create the entry
    const { data: entry, error } = await supabase
      .from("cms_collection_entries")
      .insert({
        collection_id: data.collection_id,
        name: data.name || "Untitled Entry",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection entry:", error);
      return { success: false, error: error.message };
    }

    // Initialize content structure if schema exists
    if (collection.schema_id) {
      await initializePageContent(collection.schema_id);
    }

    revalidatePath(`/dashboard/collections/${data.collection_id}/entries`);
    return { success: true, data: entry as CollectionEntry };
  } catch (error) {
    console.error("Unexpected error creating collection entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateCollectionEntry(entryId: string, data: UpdateCollectionEntryData): Promise<ActionResponse<CollectionEntry>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Verify ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from("cms_collection_entries")
      .select(
        `
        *,
        cms_collections!inner(
          cms_websites!inner(tenant_id)
        )
      `
      )
      .eq("id", entryId)
      .single();

    if (fetchError || !existingEntry || (existingEntry as any).cms_collections?.cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    const { data: entry, error } = await supabase.from("cms_collection_entries").update(data).eq("id", entryId).select().single();

    if (error) {
      console.error("Error updating collection entry:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/collections/${(existingEntry as any).collection_id}/entries`);
    revalidatePath(`/dashboard/collections/${(existingEntry as any).collection_id}/entries/${entryId}`);
    return { success: true, data: entry as CollectionEntry };
  } catch (error) {
    console.error("Unexpected error updating collection entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteCollectionEntry(entryId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Verify ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from("cms_collection_entries")
      .select(
        `
        collection_id,
        cms_collections!inner(
          cms_websites!inner(tenant_id)
        )
      `
      )
      .eq("id", entryId)
      .single();

    if (fetchError || !existingEntry || (existingEntry as any).cms_collections?.cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    const { error } = await supabase.from("cms_collection_entries").delete().eq("id", entryId);

    if (error) {
      console.error("Error deleting collection entry:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/collections/${existingEntry.collection_id}/entries`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting collection entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getCollectionEntries(collectionId: string): Promise<ActionResponse<CollectionEntry[]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Verify collection ownership
    const { data: collection, error: collectionError } = await supabase
      .from("cms_collections")
      .select(
        `
        id,
        cms_websites!inner(tenant_id)
      `
      )
      .eq("id", collectionId)
      .single();

    if (collectionError || !collection || (collection as any).cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Collection not found or access denied." };
    }

    const { data: entries, error } = await supabase
      .from("cms_collection_entries")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching collection entries:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: entries as CollectionEntry[] };
  } catch (error) {
    console.error("Unexpected error fetching collection entries:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getCollectionEntryById(entryId: string): Promise<ActionResponse<CollectionEntryWithItems>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: entry, error } = await supabase
      .from("cms_collection_entries")
      .select(
        `
        *,
        cms_collections!inner(
          cms_websites!inner(tenant_id)
        ),
        cms_collections_items(
          id,
          schema_field_id,
          content,
          field_type,
          name,
          order,
          parent_field_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", entryId)
      .order("order", { ascending: true, referencedTable: "cms_collections_items" })
      .single();

    if (error || !entry || (entry as any).cms_collections?.cms_websites?.tenant_id !== tenantId) {
      console.error("Error fetching collection entry:", error);
      return { success: false, error: "Entry not found or access denied." };
    }

    return { success: true, data: entry as CollectionEntryWithItems };
  } catch (error) {
    console.error("Unexpected error fetching collection entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============== COLLECTION ENTRY CONTENT MANAGEMENT ==============

export async function initializeCollectionEntryContent(entryId: string, schemaId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    // Get schema with sections and fields
    const { data: schema, error: schemaError } = await supabase
      .from("cms_schemas")
      .select(
        `
        id,
        cms_schema_sections(
          id,
          cms_schema_fields(
            id,
            name,
            type,
            default_value,
            order,
            parent_field_id
          )
        )
      `
      )
      .eq("id", schemaId)
      .single();

    if (schemaError || !schema) {
      console.error("Error fetching schema:", schemaError);
      return { success: false, error: "Failed to fetch schema." };
    }

    // Get the collection_id for this entry
    const { data: entry, error: entryError } = await supabase.from("cms_collection_entries").select("collection_id").eq("id", entryId).single();

    if (entryError || !entry) {
      return { success: false, error: "Entry not found." };
    }

    // Create collection items for each field
    const items: any[] = [];

    (schema as any).cms_schema_sections?.forEach((section: any) => {
      section.cms_schema_fields?.forEach((field: any) => {
        items.push({
          cms_collection_entry_id: entryId,
          collection_id: entry.collection_id,
          schema_field_id: field.id,
          name: field.name,
          field_type: field.type,
          content: field.default_value ? JSON.parse(field.default_value) : null,
          order: field.order,
          parent_field_id: field.parent_field_id,
          created_by: user.id,
        });
      });
    });

    if (items.length > 0) {
      const { error: insertError } = await supabase.from("cms_collections_items").insert(items);

      if (insertError) {
        console.error("Error inserting collection items:", insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error initializing collection entry content:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function saveCollectionEntryContent(
  entryId: string,
  updatedFields: Array<{
    id: string; // schema field ID
    content: any;
    type: string;
    item_id?: string | null; // actual collection item ID
  }>
): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Verify ownership
    const { data: entry, error: entryError } = await supabase
      .from("cms_collection_entries")
      .select(
        `
        collection_id,
        cms_collections!inner(
          cms_websites!inner(tenant_id)
        )
      `
      )
      .eq("id", entryId)
      .single();

    if (entryError || !entry || (entry as any).cms_collections?.cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    if (updatedFields.length === 0) {
      return { success: true };
    }

    // Process each updated field
    const updatePromises = updatedFields.map(async (field) => {
      const { id: schemaFieldId, content: value, type: fieldType, item_id } = field;

      // Format the content based on field type (reuse logic from schema-content-actions)
      const formattedContent = formatContentForFieldType(fieldType, value);

      const { error, data } = await supabase.from("cms_collections_items").upsert(
        {
          id: item_id || undefined,
          schema_field_id: schemaFieldId,
          cms_collection_entry_id: entryId,
          collection_id: entry.collection_id,
          content: formattedContent,
          field_type: fieldType as "number" | "boolean" | "text" | "date" | "richtext" | "image" | "reference" | "section",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (error) {
        console.error(`Error saving field ${schemaFieldId}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    revalidatePath(`/dashboard/collections/${entry.collection_id}/entries`);
    revalidatePath(`/dashboard/collections/${entry.collection_id}/entries/${entryId}`);

    return { success: true };
  } catch (error) {
    console.error("Error saving collection entry content:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save content" };
  }
}

// Helper function to format content based on field type
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

const isRichTextEmpty = (value: any): boolean => {
  if (!value || typeof value !== "object") return true;
  if (!value.content || !Array.isArray(value.content)) return true;
  return (
    value.content.length === 0 ||
    (value.content.length === 1 && value.content[0].type === "paragraph" && (!value.content[0].content || value.content[0].content.length === 0))
  );
};

const formatContentForFieldType = (fieldType: string, value: any): any => {
  if (fieldType === "richtext") {
    return isRichTextEmpty(value) ? null : value;
  } else if (isEmpty(value)) {
    return null;
  }

  switch (fieldType) {
    case "text":
      return value.toString();

    case "number":
      return Number(value);

    case "boolean":
      return Boolean(value);

    case "date":
      return new Date(value).toISOString();

    case "image":
      return {
        url: value.url || value,
        alt: value.alt || "",
        caption: value.caption || "",
      };

    case "reference":
      return {
        collection_id: value.collection_id || value,
        entry_id: value.entry_id || null,
      };

    default:
      return value;
  }
};
