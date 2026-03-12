"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

// ============== TYPES ==============

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  schema_id: string | null;
  website_id: string | null;
  created_by: string;
  created_at: string;
}

export interface CollectionWithSchema extends Collection {
  cms_schemas?: {
    id: string;
    name: string;
    description: string | null;
    cms_schema_sections?: Array<{
      id: string;
      name: string;
      description?: string | null;
      order: number | null;
      cms_schema_fields?: Array<{
        id: string;
        field_key?: string;
        name: string;
        type: string;
        required?: boolean;
        default_value?: string | null;
        validation?: string | null;
        settings?: Record<string, any> | null;
        collection_id?: string | null;
        order: number;
        parent_field_id?: string | null;
        schema_section_id?: string;
        created_at?: string;
        updated_at?: string | null;
        fields?: Array<CollectionWithSchema['cms_schemas']['cms_schema_sections'][0]['cms_schema_fields'][0]>;
      }>;
    }>;
  };
}

interface CreateCollectionData {
  name: string;
  description?: string;
  website_id: string;
  schema_id: string;
}

interface UpdateCollectionData {
  name?: string;
  description?: string;
}

// ============== COLLECTION CRUD ==============

export async function createCollection(data: CreateCollectionData): Promise<ActionResponse<Collection>> {
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
    // Verify the website belongs to the tenant
    const { data: website, error: websiteError } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("id", data.website_id)
      .eq("tenant_id", tenantId)
      .single();

    if (websiteError || !website) {
      return { success: false, error: "Website not found or access denied." };
    }



    // Create the collection
    const { data: collection, error } = await supabase
      .from("cms_collections")
      .insert({
        name: data.name,
        description: data.description,
        website_id: data.website_id,
        schema_id: data.schema_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      // Clean up the schema if collection creation failed
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/collections");
    return { success: true, data: collection as Collection };
  } catch (error) {
    console.error("Unexpected error creating collection:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateCollection(collectionId: string, data: UpdateCollectionData): Promise<ActionResponse<Collection>> {
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
    // Verify ownership through website
    const { data: existingCollection, error: fetchError } = await supabase
      .from("cms_collections")
      .select(
        `
        *,
        cms_websites!inner(tenant_id)
      `
      )
      .eq("id", collectionId)
      .single();

    if (fetchError || !existingCollection || (existingCollection as any).cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Collection not found or access denied." };
    }

    const { data: collection, error } = await supabase.from("cms_collections").update(data).eq("id", collectionId).select().single();

    if (error) {
      console.error("Error updating collection:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/collections");
    revalidatePath(`/dashboard/collections/${collectionId}`);
    return { success: true, data: collection as Collection };
  } catch (error) {
    console.error("Unexpected error updating collection:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteCollection(collectionId: string): Promise<ActionResponse<void>> {
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
    // Verify ownership and get schema_id
    const { data: existingCollection, error: fetchError } = await supabase
      .from("cms_collections")
      .select(
        `
        schema_id,
        cms_websites!inner(tenant_id)
      `
      )
      .eq("id", collectionId)
      .single();

    if (fetchError || !existingCollection || (existingCollection as any).cms_websites?.tenant_id !== tenantId) {
      return { success: false, error: "Collection not found or access denied." };
    }

    // Delete the collection (cascade will handle entries and items)
    const { error } = await supabase.from("cms_collections").delete().eq("id", collectionId);

    if (error) {
      console.error("Error deleting collection:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/collections");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting collection:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getCollectionsByWebsite(websiteId: string): Promise<ActionResponse<CollectionWithSchema[]>> {
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
    // Verify website ownership
    const { data: website, error: websiteError } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("id", websiteId)
      .eq("tenant_id", tenantId)
      .single();

    if (websiteError || !website) {
      return { success: false, error: "Website not found or access denied." };
    }

    const { data: collections, error } = await supabase
      .from("cms_collections")
      .select(
        `
        *,
        cms_schemas(
          id,
          name,
          description
        )
      `
      )
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching collections:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: collections as CollectionWithSchema[] };
  } catch (error) {
    console.error("Unexpected error fetching collections:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getCollectionById(collectionId: string): Promise<ActionResponse<CollectionWithSchema>> {
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
    const { data: collection, error } = await supabase
      .from("cms_collections")
      .select(
        `
        *,
        cms_websites!inner(tenant_id),
        cms_schemas(
          id,
          name,
          description,
          cms_schema_sections(
            id,
            name,
            description,
            order,
            cms_schema_fields(
              id,
              name,
              type,
              required,
              default_value,
              validation,
              order,
              parent_field_id,
              settings
            )
          )
        )
      `
      )
      .eq("id", collectionId)
      .order("order", { ascending: true, referencedTable: "cms_schemas.cms_schema_sections" })
      .order("order", { ascending: true, referencedTable: "cms_schemas.cms_schema_sections.cms_schema_fields" })
      .single();

    if (error || !collection || (collection as any).cms_websites?.tenant_id !== tenantId) {
      console.error("Error fetching collection:", error);
      return { success: false, error: "Collection not found or access denied." };
    }

    // Sort sections and fields client-side to ensure proper order
    if (collection && (collection as any).cms_schemas?.cms_schema_sections) {
      const sortedCollection = {
        ...collection,
        cms_schemas: {
          ...(collection as any).cms_schemas,
          cms_schema_sections: (collection as any).cms_schemas.cms_schema_sections
            .map((section: any) => ({
              ...section,
              cms_schema_fields: section.cms_schema_fields?.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) || [],
            }))
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
        },
      };
      return { success: true, data: sortedCollection as CollectionWithSchema };
    }

    // Fix: defensively map collection to CollectionWithSchema shape
    if (collection) {
      const shaped: CollectionWithSchema = {
        ...collection,
        cms_schemas: collection.cms_schemas
          ? {
              id: collection.cms_schemas.id,
              name: collection.cms_schemas.name,
              description: collection.cms_schemas.description,
              cms_schema_sections: collection.cms_schemas.cms_schema_sections
                ? collection.cms_schemas.cms_schema_sections.map((section: any) => ({
                    id: section.id,
                    name: section.name,
                    order: section.order,
                    cms_schema_fields: Array.isArray(section.cms_schema_fields)
                      ? section.cms_schema_fields.map((field: any) => ({
                          id: field.id,
                          name: field.name,
                          type: field.type,
                          order: field.order,
                          settings: field.settings ?? null,
                        }))
                      : [],
                  }))
                : [],
            }
          : undefined,
      };

      return { success: true, data: shaped };
    }

    return { success: false, error: "Collection not found." };
  } catch (error) {
    console.error("Unexpected error fetching collection:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
