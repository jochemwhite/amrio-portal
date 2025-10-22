"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { CollectionWithSchema } from "./collection-actions";

/**
 * Fetches a collection with its full schema in a single RPC call
 * This combines getCollectionById and getSchemaById functionality
 * 
 * @param collectionId - The UUID of the collection to fetch
 * @returns ActionResponse containing the collection with full schema details
 */
export async function getCollectionWithSchemaRPC(
  collectionId: string
): Promise<ActionResponse<CollectionWithSchema>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('get_collection_with_schema', {
      p_collection_id: collectionId,
      p_tenant_id: tenantId,
    });


    if (error) {
      console.error("Error calling get_collection_with_schema RPC:", error);
      return { success: false, error: error.message };
    }

    // The RPC function returns a JSON object with success/error structure
    if (!data.success) {
      return { success: false, error: data.error || "Failed to fetch collection" };
    }

    // Sort sections and fields client-side to ensure proper order (same as original implementation)
    const collectionData = data.data;
    if (collectionData?.cms_schemas?.cms_schema_sections) {
      const sortedCollection = {
        ...collectionData,
        cms_schemas: {
          ...collectionData.cms_schemas,
          cms_schema_sections: collectionData.cms_schemas.cms_schema_sections
            .map((section: any) => ({
              ...section,
              cms_schema_fields: section.cms_schema_fields?.sort(
                (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
              ) || [],
            }))
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
        },
      };
      return { success: true, data: sortedCollection as CollectionWithSchema };
    }

    return { success: true, data: collectionData as CollectionWithSchema };
  } catch (error) {
    console.error("Unexpected error calling get_collection_with_schema RPC:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

