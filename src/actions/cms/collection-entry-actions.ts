"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { RPCCollectionEntryResponse } from "@/types/cms";
import { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

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
    settings?: Record<string, any> | null;
    items?: Array<CollectionEntryWithItems['cms_collections_items']>;
  }>;
}

interface CreateCollectionEntryData {
  collection_id: string;
  name?: string;
}

interface UpdateCollectionEntryData {
  name?: string;
}

type SchemaSectionRow = {
  id: string;
  name: string;
  description: string | null;
  order: number | null;
};

type SchemaFieldRow = {
  id: string;
  name: string;
  type: Database["public"]["Enums"]["field_type"];
  order: number | null;
  required: boolean;
  validation: string | null;
  default_value: string | null;
  parent_field_id: string | null;
  collection_id: string | null;
  settings: Record<string, any> | null;
  schema_section_id: string;
};

const parseDefaultValue = (defaultValue: string | null): any => {
  if (!defaultValue || defaultValue.trim() === "") return null;
  try {
    return JSON.parse(defaultValue);
  } catch {
    return defaultValue;
  }
};

function nestCollectionFields(
  fields: SchemaFieldRow[],
  contentBySchemaFieldId: Map<string, { id: string; content: any }>
): RPCCollectionEntryResponse["sections"][number]["fields"] {
  const byId = new Map<string, RPCCollectionEntryResponse["sections"][number]["fields"][number]>();

  for (const field of fields) {
    const contentRecord = contentBySchemaFieldId.get(field.id);
    byId.set(field.id, {
      id: field.id,
      name: field.name,
      description: "",
      type: field.type,
      order: field.order || 0,
      required: field.required,
      created_at: "",
      updated_at: "",
      validation: field.validation || "",
      default_value: field.default_value || "",
      parent_field_id: field.parent_field_id,
      collection_id: field.collection_id,
      settings: field.settings,
      content: contentRecord ? ({ value: contentRecord.content } as { value?: any }) : null,
      content_field_id: contentRecord?.id || null,
      fields: [],
    });
  }

  const roots: RPCCollectionEntryResponse["sections"][number]["fields"] = [];

  for (const field of [...fields].sort((a, b) => (a.order || 0) - (b.order || 0))) {
    const node = byId.get(field.id);
    if (!node) continue;

    if (field.parent_field_id) {
      const parent = byId.get(field.parent_field_id);
      if (parent) {
        if (!parent.fields) parent.fields = [];
        parent.fields.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}

async function getSchemaStructure(supabase: Awaited<ReturnType<typeof createClient>>, schemaId: string) {
  const { data: schemaSections, error: sectionsError } = await supabase
    .from("cms_schema_sections")
    .select("id, name, description, order")
    .eq("schema_id", schemaId)
    .order("order", { ascending: true });

  if (sectionsError) {
    return { error: sectionsError.message, sections: [] as SchemaSectionRow[], fields: [] as SchemaFieldRow[] };
  }

  const sectionIds = (schemaSections || []).map((section) => section.id);
  if (sectionIds.length === 0) {
    return { error: null, sections: schemaSections as SchemaSectionRow[], fields: [] as SchemaFieldRow[] };
  }

  const { data: schemaFields, error: fieldsError } = await supabase
    .from("cms_schema_fields")
    .select("id, name, type, order, required, validation, default_value, parent_field_id, collection_id, settings, schema_section_id")
    .in("schema_section_id", sectionIds)
    .order("order", { ascending: true });

  if (fieldsError) {
    return { error: fieldsError.message, sections: [] as SchemaSectionRow[], fields: [] as SchemaFieldRow[] };
  }

  return {
    error: null,
    sections: (schemaSections || []) as SchemaSectionRow[],
    fields: (schemaFields || []) as SchemaFieldRow[],
  };
}

async function ensureCollectionSections(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
  schemaSections: SchemaSectionRow[]
) {
  if (schemaSections.length === 0) {
    return { error: null, sectionIdBySchemaSectionId: new Map<string, string>() };
  }

  const schemaSectionIds = schemaSections.map((section) => section.id);

  const { data: existingSections, error: existingSectionsError } = await supabase
    .from("cms_content_sections")
    .select("id, schema_section_id")
    .eq("cms_collection_entry_id", entryId)
    .in("schema_section_id", schemaSectionIds);

  if (existingSectionsError) {
    return { error: existingSectionsError.message, sectionIdBySchemaSectionId: new Map<string, string>() };
  }

  const sectionIdBySchemaSectionId = new Map<string, string>();
  for (const section of existingSections || []) {
    if (section.schema_section_id) {
      sectionIdBySchemaSectionId.set(section.schema_section_id, section.id);
    }
  }

  const missingSections = schemaSections.filter((section) => !sectionIdBySchemaSectionId.has(section.id));
  if (missingSections.length > 0) {
    const { data: insertedSections, error: insertSectionsError } = await supabase
      .from("cms_content_sections")
      .insert(
        missingSections.map((section) => ({
          cms_collection_entry_id: entryId,
          schema_section_id: section.id,
          name: section.name,
          description: section.description,
          order: section.order || 0,
        }))
      )
      .select("id, schema_section_id");

    if (insertSectionsError) {
      return { error: insertSectionsError.message, sectionIdBySchemaSectionId: new Map<string, string>() };
    }

    for (const section of insertedSections || []) {
      if (section.schema_section_id) {
        sectionIdBySchemaSectionId.set(section.schema_section_id, section.id);
      }
    }
  }

  return { error: null, sectionIdBySchemaSectionId };
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

    // Initialize entry-specific content structure if a schema exists.
    if (collection.schema_id) {
      await initializeCollectionEntryContent(entry.id, collection.schema_id);
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
          schema_id,
          cms_websites!inner(tenant_id)
        )
      `
      )
      .eq("id", entryId)
      .single();

    if (error || !entry || (entry as any).cms_collections?.cms_websites?.tenant_id !== tenantId) {
      console.error("Error fetching collection entry:", error);
      return { success: false, error: "Entry not found or access denied." };
    }

    const collection = Array.isArray((entry as any).cms_collections) ? (entry as any).cms_collections[0] : (entry as any).cms_collections;
    const schemaId = collection?.schema_id;
    if (!schemaId) {
      return { success: true, data: { ...(entry as any), cms_collections_items: [] } as CollectionEntryWithItems };
    }

    const { sections: schemaSections, error: schemaError } = await getSchemaStructure(supabase, schemaId);
    if (schemaError) {
      return { success: false, error: schemaError };
    }

    const { sectionIdBySchemaSectionId, error: sectionsError } = await ensureCollectionSections(supabase, entryId, schemaSections);
    if (sectionsError) {
      return { success: false, error: sectionsError };
    }

    const sectionIds = [...sectionIdBySchemaSectionId.values()];
    if (sectionIds.length === 0) {
      return { success: true, data: { ...(entry as any), cms_collections_items: [] } as CollectionEntryWithItems };
    }

    const { data: contentFields, error: contentFieldsError } = await supabase
      .from("cms_content_fields")
      .select("id, schema_field_id, content, type, name, order, parent_field_id, created_at, updated_at")
      .eq("collection_id", entry.collection_id)
      .in("section_id", sectionIds)
      .order("order", { ascending: true });

    if (contentFieldsError) {
      return { success: false, error: contentFieldsError.message };
    }

    const items = (contentFields || []).map((field) => ({
      id: field.id,
      schema_field_id: field.schema_field_id,
      content: field.content,
      field_type: field.type,
      name: field.name,
      order: field.order || 0,
      parent_field_id: field.parent_field_id,
      created_at: field.created_at || "",
      updated_at: field.updated_at,
    }));

    return { success: true, data: { ...(entry as any), cms_collections_items: items } as CollectionEntryWithItems };
  } catch (error) {
    console.error("Unexpected error fetching collection entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============== RPC FUNCTION TO GET COLLECTION ENTRY (SIMILAR TO GET_PAGE) ==============

export async function getCollectionEntryRPC(entryId: string): Promise<ActionResponse<RPCCollectionEntryResponse>> {
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
    const { data: entry, error: entryError } = await supabase
      .from("cms_collection_entries")
      .select(
        `
        id,
        collection_id,
        name,
        created_at,
        cms_collections!inner(
          id,
          name,
          description,
          schema_id,
          cms_websites!inner(tenant_id),
          cms_schemas(
            id,
            name,
            description,
            template
          )
        )
      `
      )
      .eq("id", entryId)
      .single();

    if (entryError || !entry) {
      return { success: false, error: "Collection entry not found" };
    }

    const collection = Array.isArray((entry as any).cms_collections) ? (entry as any).cms_collections[0] : (entry as any).cms_collections;
    if (!collection || (collection as any).cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Collection entry not found or access denied." };
    }

    if (!collection.schema_id) {
      return {
        success: true,
        data: {
          id: entry.id,
          name: entry.name || "Untitled Entry",
          created_at: entry.created_at,
          collection_id: collection.id,
          collection_name: collection.name,
          collection_description: collection.description,
          schema_id: null,
          schema_name: null,
          schema_description: null,
          schema_template: null,
          sections: [],
        },
      };
    }

    const schema = Array.isArray(collection.cms_schemas) ? collection.cms_schemas[0] : collection.cms_schemas;
    const { sections: schemaSections, fields: schemaFields, error: schemaError } = await getSchemaStructure(supabase, collection.schema_id);
    if (schemaError) {
      return { success: false, error: schemaError };
    }

    const { sectionIdBySchemaSectionId, error: ensureSectionsError } = await ensureCollectionSections(supabase, entryId, schemaSections);
    if (ensureSectionsError) {
      return { success: false, error: ensureSectionsError };
    }

    const sectionIds = [...sectionIdBySchemaSectionId.values()];
    const contentBySectionAndSchemaField = new Map<string, { id: string; content: any }>();
    if (sectionIds.length > 0) {
      const { data: contentFields, error: contentFieldsError } = await supabase
        .from("cms_content_fields")
        .select("id, section_id, schema_field_id, content")
        .eq("collection_id", collection.id)
        .in("section_id", sectionIds);

      if (contentFieldsError) {
        return { success: false, error: contentFieldsError.message };
      }

      for (const field of contentFields || []) {
        contentBySectionAndSchemaField.set(`${field.section_id}:${field.schema_field_id}`, {
          id: field.id,
          content: field.content,
        });
      }
    }

    const sections = schemaSections.map((section) => {
      const sectionFields = schemaFields.filter((field) => field.schema_section_id === section.id);
      const contentSectionId = sectionIdBySchemaSectionId.get(section.id);
      const contentBySchemaFieldId = new Map<string, { id: string; content: any }>();

      if (contentSectionId) {
        for (const field of sectionFields) {
          const key = `${contentSectionId}:${field.id}`;
          const content = contentBySectionAndSchemaField.get(key);
          if (content) contentBySchemaFieldId.set(field.id, content);
        }
      }

      return {
        id: section.id,
        name: section.name,
        order: section.order || 0,
        fields: nestCollectionFields(sectionFields, contentBySchemaFieldId),
        page_id: entryId,
        created_at: "",
        updated_at: "",
        description: section.description || "",
      };
    });

    return {
      success: true,
      data: {
        id: entry.id,
        name: entry.name || "Untitled Entry",
        created_at: entry.created_at,
        collection_id: collection.id,
        collection_name: collection.name,
        collection_description: collection.description,
        schema_id: schema?.id || null,
        schema_name: schema?.name || null,
        schema_description: schema?.description || null,
        schema_template: schema?.template ?? null,
        sections,
      },
    };
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
    const { sections: schemaSections, fields: schemaFields, error: schemaError } = await getSchemaStructure(supabase, schemaId);
    if (schemaError) return { success: false, error: schemaError };

    // Get the collection_id for this entry
    const { data: entry, error: entryError } = await supabase.from("cms_collection_entries").select("collection_id").eq("id", entryId).single();

    if (entryError || !entry) {
      return { success: false, error: "Entry not found." };
    }

    const { sectionIdBySchemaSectionId, error: sectionsError } = await ensureCollectionSections(supabase, entryId, schemaSections);
    if (sectionsError) return { success: false, error: sectionsError };

    const sectionIds = [...sectionIdBySchemaSectionId.values()];
    if (sectionIds.length === 0 || schemaFields.length === 0) {
      return { success: true };
    }

    const schemaFieldIds = schemaFields.map((field) => field.id);
    const { data: existingFields, error: existingFieldsError } = await supabase
      .from("cms_content_fields")
      .select("section_id, schema_field_id")
      .eq("collection_id", entry.collection_id)
      .in("section_id", sectionIds)
      .in("schema_field_id", schemaFieldIds);

    if (existingFieldsError) {
      return { success: false, error: existingFieldsError.message };
    }

    const existingBySectionAndSchemaField = new Set((existingFields || []).map((field) => `${field.section_id}:${field.schema_field_id}`));

    const fieldsToInsert: Database["public"]["Tables"]["cms_content_fields"]["Insert"][] = [];
    for (const field of schemaFields) {
      const sectionId = sectionIdBySchemaSectionId.get(field.schema_section_id);
      if (!sectionId) continue;

      const key = `${sectionId}:${field.id}`;
      if (existingBySectionAndSchemaField.has(key)) continue;

      fieldsToInsert.push({
        section_id: sectionId,
        schema_field_id: field.id,
        collection_id: entry.collection_id,
        name: field.name,
        type: field.type,
        order: field.order || 0,
        parent_field_id: field.parent_field_id,
        content: parseDefaultValue(field.default_value),
      });
    }

    if (fieldsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("cms_content_fields").insert(fieldsToInsert);
      if (insertError) {
        console.error("Error inserting collection content fields:", insertError);
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
  updatedFields: string
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

    const updatedFieldsArray: Array<{
      id: string; // schema field ID
      content: any;
      type: string;
      content_field_id?: string | null; // actual content field ID
    }> = JSON.parse(updatedFields);

    if (updatedFieldsArray.length === 0) {
      return { success: true };
    }

    const schemaFieldIds = [...new Set(updatedFieldsArray.map((field) => field.id))];
    const { data: schemaFields, error: schemaFieldsError } = await supabase
      .from("cms_schema_fields")
      .select("id, schema_section_id, name, type, order, parent_field_id")
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

    const { sectionIdBySchemaSectionId, error: sectionsError } = await ensureCollectionSections(
      supabase,
      entryId,
      (schemaSections || []) as SchemaSectionRow[]
    );
    if (sectionsError) {
      return { success: false, error: sectionsError };
    }

    const sectionIds = [...sectionIdBySchemaSectionId.values()];
    const { data: existingFields, error: existingFieldsError } = await supabase
      .from("cms_content_fields")
      .select("id, section_id, schema_field_id")
      .eq("collection_id", entry.collection_id)
      .in("section_id", sectionIds)
      .in("schema_field_id", schemaFieldIds);

    if (existingFieldsError) {
      return { success: false, error: existingFieldsError.message };
    }

    const existingBySectionAndSchemaField = new Map<string, string>();
    for (const contentField of existingFields || []) {
      existingBySectionAndSchemaField.set(`${contentField.section_id}:${contentField.schema_field_id}`, contentField.id);
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
        collection_id: entry.collection_id,
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
  if (value && typeof value === "object" && value.type === "doc") {
    const content = Array.isArray(value.content) ? value.content : [];

    return (
      content.length === 0 ||
      (content.length === 1 &&
        content[0]?.type === "paragraph" &&
        (!content[0]?.content || content[0].content.length === 0))
    );
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/<p><\/p>/gi, "")
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, "")
      .trim();

    return normalized.length === 0;
  }

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
