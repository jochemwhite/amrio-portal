"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { generateTypeScript } from "@/lib/type-generator";
import { getActiveTenant } from "@/lib/utils/active-tenant-server";
import { SupabaseSchemaWithRelations } from "@/types/cms";

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generate TypeScript types for a schema
 */
export async function generateTypesForSchema(
  schemaId: string
): Promise<ActionResponse<{ types: string; schemaName: string }>> {
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

    // Fetch the schema with all sections and fields
    const { data: schema, error } = await supabase
      .from("cms_schemas")
      .select(
        `
        *,
        cms_schema_sections (
          *,
          cms_schema_fields (*)
        )
      `
      )
      .eq("id", schemaId)
      .order("order", { referencedTable: "cms_schema_sections", ascending: true })
      .order("order", { referencedTable: "cms_schema_sections.cms_schema_fields", ascending: true })
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!schema) {
      return { success: false, error: "Schema not found" };
    }

    // Collect all unique collection IDs from reference fields
    const collectionIds = new Set<string>();
    if (schema.cms_schema_sections) {
      for (const section of schema.cms_schema_sections) {
        if (section.cms_schema_fields) {
          for (const field of section.cms_schema_fields) {
            if (field.type === "reference" && field.collection_id) {
              collectionIds.add(field.collection_id);
            }
          }
        }
      }
    }

    // Fetch collection schemas if any reference fields exist
    let collections: any[] = [];
    if (collectionIds.size > 0) {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("cms_collections")
        .select(
          `
          id,
          name,
          schema_id,
          cms_schemas!inner (
            id,
            name,
            cms_schema_sections (
              *,
              cms_schema_fields (*)
            )
          )
        `
        )
        .in("id", Array.from(collectionIds));

      if (!collectionsError && collectionsData) {
        collections = collectionsData.map((col: any) => ({
          id: col.id,
          name: col.name,
          cms_schema_sections: col.cms_schemas?.cms_schema_sections || [],
        }));
      }
    }

    // Generate TypeScript types
    const types = generateTypeScript(schema as SupabaseSchemaWithRelations, collections);

    return {
      success: true,
      data: {
        types,
        schemaName: schema.name,
      },
    };
  } catch (error) {
    console.error("Error generating types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all schemas for the current tenant
 */
export async function getSchemasForTenant(): Promise<
  ActionResponse<Array<{ id: string; name: string; description: string | null; template: boolean }>>
> {
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

    // Get user's tenant
    const tenantData = await getActiveTenant();

    if (!tenantData) {
      return { success: false, error: "No tenant found" };
    }

    // Fetch all schemas for the tenant
    const { data: schemas, error } = await supabase
      .from("cms_schemas")
      .select("id, name, description, template")
      .eq("tenant_id", tenantData.id)
      .order("name");

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: schemas || [],
    };
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

