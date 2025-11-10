"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Schema, SchemaField, SchemaSection } from "@/types/cms";
import { revalidatePath } from "next/cache";
import { initializePageContent } from "./schema-content-actions";

// ============== SCHEMA MANAGEMENT ==============

interface CreateSchemaData {
  name: string;
  description?: string;
  template?: boolean;
  schema_type: "page" | "collection";
}

interface UpdateSchemaData {
  name?: string;
  description?: string;
  template?: boolean;
  schema_type?: "page" | "collection";
}

export async function createSchema(data: CreateSchemaData): Promise<ActionResponse<Schema>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create schemas." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: schema, error } = await supabase
      .from("cms_schemas")
      .insert({
        name: data.name,
        description: data.description,
        template: data.template ?? false,
        created_by: user.id,
        tenant_id: tenantId,
        schema_type: data.schema_type ?? "page",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating schema:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin/schemas");
    revalidatePath("/dashboard/schemas");
    return { success: true, data: schema as Schema };
  } catch (error) {
    console.error("Unexpected error creating schema:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateSchema(schemaId: string, data: UpdateSchemaData): Promise<ActionResponse<Schema>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update schemas." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: schema, error } = await supabase.from("cms_schemas").update({
      ...data,
      schema_type: data.schema_type ?? "page",
    }).eq("id", schemaId).eq("tenant_id", tenantId).select().single();

    if (error) {
      console.error("Error updating schema:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin/schemas");
    revalidatePath("/dashboard/schemas");
    return { success: true, data: schema as Schema };
  } catch (error) {
    console.error("Unexpected error updating schema:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteSchema(schemaId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete schemas." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { error } = await supabase.from("cms_schemas").delete().eq("id", schemaId).eq("tenant_id", tenantId);

    if (error) {
      console.error("Error deleting schema:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin/schemas");
    revalidatePath("/dashboard/schemas");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting schema:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllSchemas(): Promise<ActionResponse<Schema[]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can view all schemas." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: schemas, error } = await supabase
      .from("cms_schemas")
      .select(
        `
        *,
        cms_schema_sections (
          id,
          order,
          cms_schema_fields (
            id,
            order
          )
        )
      `
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .order("order", { ascending: true, referencedTable: "cms_schema_sections" })
      .order("order", { ascending: true, referencedTable: "cms_schema_sections.cms_schema_fields" });

    if (error) {
      console.error("Error fetching schemas:", error);
      return { success: false, error: error.message };
    }

    // Additional client-side sorting to ensure proper order for nested data
    const sortedSchemas = schemas?.map((schema) => ({
      ...schema,
      cms_schema_sections:
        schema.cms_schema_sections
          ?.map((section: any) => ({
            ...section,
            cms_schema_fields: section.cms_schema_fields?.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) || [],
          }))
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) || [],
    }));

    return { success: true, data: sortedSchemas as Schema[] };
  } catch (error) {
    console.error("Unexpected error fetching schemas:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getSchemaById(schemaId: string): Promise<ActionResponse<Schema>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can view schemas." };
  }

  // Get active tenant ID
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: schema, error } = await supabase
      .from("cms_schemas")
      .select(
        `
        *,
        cms_schema_sections (
          *,
          cms_schema_fields (
            *
          )
        )
      `
      )
      .eq("id", schemaId)
      .eq("tenant_id", tenantId)
      .order("order", { ascending: true, referencedTable: "cms_schema_sections" })
      .order("order", { ascending: true, referencedTable: "cms_schema_sections.cms_schema_fields" })
      .single();

    if (error) {
      console.error("Error fetching schema:", error);
      return { success: false, error: error.message };
    }

    // Additional client-side sorting to ensure proper order
    if (schema && (schema as any).cms_schema_sections) {
      const sortedSchema = {
        ...schema,
        cms_schema_sections: (schema as any).cms_schema_sections
          .map((section: any) => ({
            ...section,
            cms_schema_fields: section.cms_schema_fields?.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) || [],
          }))
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
      };
      return { success: true, data: sortedSchema as Schema };
    }

    return { success: true, data: schema as Schema };
  } catch (error) {
    console.error("Unexpected error fetching schema:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============== SCHEMA SECTION MANAGEMENT ==============

interface CreateSchemaSectionData {
  schema_id: string;
  name: string;
  description?: string;
  order?: number;
}

interface UpdateSchemaSectionData {
  name?: string;
  description?: string;
  order?: number;
}

export async function createSchemaSection(data: CreateSchemaSectionData): Promise<ActionResponse<SchemaSection>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create schema sections." };
  }

  try {
    // Get the next order value if not provided
    let order = data.order;
    if (order === undefined) {
      const { data: existingSections, error: countError } = await supabase
        .from("cms_schema_sections")
        .select("order")
        .eq("schema_id", data.schema_id)
        .order("order", { ascending: false })
        .limit(1);

      if (countError) {
        console.error("Error getting section count:", countError);
        order = 0;
      } else {
        order = (existingSections?.[0]?.order ?? -1) + 1;
      }
    }

    const { data: section, error } = await supabase
      .from("cms_schema_sections")
      .insert({
        schema_id: data.schema_id,
        name: data.name,
        description: data.description,
        order: order,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating schema section:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true, data: section as SchemaSection };
  } catch (error) {
    console.error("Unexpected error creating schema section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateSchemaSection(sectionId: string, data: UpdateSchemaSectionData): Promise<ActionResponse<SchemaSection>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update schema sections." };
  }

  try {
    const { data: section, error } = await supabase.from("cms_schema_sections").update(data).eq("id", sectionId).select().single();

    if (error) {
      console.error("Error updating schema section:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true, data: section as SchemaSection };
  } catch (error) {
    console.error("Unexpected error updating schema section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteSchemaSection(sectionId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete schema sections." };
  }

  try {
    const { error } = await supabase.from("cms_schema_sections").delete().eq("id", sectionId);

    if (error) {
      console.error("Error deleting schema section:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting schema section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============== SCHEMA FIELD MANAGEMENT ==============

interface CreateSchemaFieldData {
  schema_section_id: string;
  name: string;
  field_key: string;
  type: string;
  required?: boolean;
  default_value?: string;
  validation?: string;
  order?: number;
  parent_field_id?: string;
}

interface UpdateSchemaFieldData {
  name?: string;
  field_key?: string;
  type?: string;
  required?: boolean;
  default_value?: string;
  validation?: string;
  order?: number;
}

export async function createSchemaField(data: CreateSchemaFieldData): Promise<ActionResponse<SchemaField>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create schema fields." };
  }

  try {
    // Get the next order value if not provided
    let order = data.order;
    if (order === undefined) {
      const { data: existingFields, error: countError } = await supabase
        .from("cms_schema_fields")
        .select("order")
        .eq("schema_section_id", data.schema_section_id)
        .order("order", { ascending: false })
        .limit(1);

      if (countError) {
        console.error("Error getting field count:", countError);
        order = 0;
      } else {
        order = (existingFields?.[0]?.order ?? -1) + 1;
      }
    }

    const { data: field, error } = await supabase
      .from("cms_schema_fields")
      .insert({
        schema_section_id: data.schema_section_id,
        name: data.name,
        field_key: data.field_key,
        type: data.type as any, // Cast to any to handle enum type
        required: data.required ?? false,
        default_value: data.default_value,
        validation: data.validation,
        order: order,
        parent_field_id: data.parent_field_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating schema field:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true, data: field as SchemaField };
  } catch (error) {
    console.error("Unexpected error creating schema field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateSchemaField(fieldId: string, data: UpdateSchemaFieldData): Promise<ActionResponse<SchemaField>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update schema fields." };
  }

  try {
    const { data: field, error } = await supabase
      .from("cms_schema_fields")
      .update({
        ...data,
        type: data.type as any, // Cast to any to handle enum type
      })
      .eq("id", fieldId)
      .select()
      .single();

    if (error) {
      console.error("Error updating schema field:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true, data: field as SchemaField };
  } catch (error) {
    console.error("Unexpected error updating schema field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteSchemaField(fieldId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete schema fields." };
  }

  try {
    const { error } = await supabase.from("cms_schema_fields").delete().eq("id", fieldId);

    if (error) {
      console.error("Error deleting schema field:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/schemas");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting schema field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============== BULK SAVE SCHEMA CHANGES ==============

interface BulkSaveSchemaPayload {
  schemaId: string;
  changes: Array<{
    type: "create" | "update" | "delete" | "reorder";
    entity: "section" | "field" | "sections" | "fields";
    id?: string;
    data?: any;
    tempId?: string;
  }>;
  sectionOrder: string[];
  fieldOrders: Record<string, string[]>; // sectionId -> fieldIds[]
}

interface BulkSaveSchemaResult {
  success: boolean;
  error?: string;
  tempIdMap: Record<string, string>; // Maps temp IDs to real IDs
}

export async function bulkSaveSchemaChanges(payload: BulkSaveSchemaPayload): Promise<BulkSaveSchemaResult> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized", tempIdMap: {} };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can save schema changes.", tempIdMap: {} };
  }

  try {
    const tempIdMap: Record<string, string> = {};

    // Process changes in order: creates first, then updates, then deletes, then reorders
    const creates = payload.changes.filter((c) => c.type === "create");
    const updates = payload.changes.filter((c) => c.type === "update");
    const deletes = payload.changes.filter((c) => c.type === "delete");
    const reorders = payload.changes.filter((c) => c.type === "reorder");


    // 1. Process creates
    for (const change of creates) {
      if (change.entity === "section") {
        
        const { data: section, error } = await supabase
          .from("cms_schema_sections")
          .insert({
            schema_id: payload.schemaId,
            name: change.data.name,
            description: change.data.description,
            order: 0, // Will update order later
          })
          .select()
          .single();

        if (error) throw error;
        if (change.tempId && section) {
          tempIdMap[change.tempId] = section.id;
        }
      } else if (change.entity === "field") {
        // Map temp section IDs to real IDs
        const sectionId = change.data.schema_section_id.startsWith("temp_")
          ? tempIdMap[change.data.schema_section_id]
          : change.data.schema_section_id;

        const parentFieldId = change.data.parent_field_id?.startsWith("temp_") ? tempIdMap[change.data.parent_field_id] : change.data.parent_field_id;
        let collectionId = change.data.collection_id?.startsWith("temp_") ? tempIdMap[change.data.collection_id] : change.data.collection_id;
        if (!collectionId || collectionId === "") {
          collectionId = null;
        }

        const { data: field, error } = await supabase
          .from("cms_schema_fields")
          .insert({
            schema_section_id: sectionId,
            name: change.data.name,
            field_key: change.data.field_key,
            type: change.data.type,
            required: change.data.required ?? false,
            default_value: change.data.default_value,
            validation: change.data.validation,
            order: 0, // Will update order later
            parent_field_id: parentFieldId,
            collection_id: collectionId || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (change.tempId && field) {
          tempIdMap[change.tempId] = field.id;
        }
      }
    }

    // 2. Process updates
    for (const change of updates) {
      if (change.entity === "section" && change.id) {
        const { error } = await supabase
          .from("cms_schema_sections")
          .update({
            name: change.data.name,
            description: change.data.description,
          })
          .eq("id", change.id);

        if (error) throw error;
      } else if (change.entity === "field" && change.id) {
        const parentFieldId = change.data.parent_field_id?.startsWith("temp_") ? tempIdMap[change.data.parent_field_id] : change.data.parent_field_id;
        const collectionId = change.data.collection_id?.startsWith("temp_") ? tempIdMap[change.data.collection_id] : change.data.collection_id;

        const { error } = await supabase
          .from("cms_schema_fields")
          .update({
            name: change.data.name,
            field_key: change.data.field_key,
            type: change.data.type,
            required: change.data.required,
            default_value: change.data.default_value,
            validation: change.data.validation,
            parent_field_id: parentFieldId,
            collection_id: collectionId,
          })
          .eq("id", change.id);

        if (error) throw error;
      }
    }

    // 3. Process deletes (in reverse order to avoid FK issues)
    for (const change of deletes.reverse()) {
      if (change.entity === "field" && change.id) {
        const { error } = await supabase.from("cms_schema_fields").delete().eq("id", change.id);

        if (error) throw error;
      } else if (change.entity === "section" && change.id) {
        const { error } = await supabase.from("cms_schema_sections").delete().eq("id", change.id);

        if (error) throw error;
      }
    }

    // 4. Process reorders from pendingChanges (if any)
    for (const reorder of reorders) {
      if (reorder.entity === "sections" && reorder.data?.sectionOrder) {
        // Update section order from reorder change
        const sectionOrderUpdates = reorder.data.sectionOrder.map((sectionId: string, index: number) => {
          const realId = sectionId.startsWith("temp_") ? tempIdMap[sectionId] : sectionId;
          return supabase.from("cms_schema_sections").update({ order: index }).eq("id", realId);
        });
        await Promise.all(sectionOrderUpdates);
      } else if (reorder.entity === "fields" && reorder.data?.sectionId && reorder.data?.fieldOrder) {
        // Update field order from reorder change
        const realSectionId = reorder.data.sectionId.startsWith("temp_") ? tempIdMap[reorder.data.sectionId] : reorder.data.sectionId;
        const fieldOrderUpdates = reorder.data.fieldOrder.map((fieldId: string, index: number) => {
          const realFieldId = fieldId.startsWith("temp_") ? tempIdMap[fieldId] : fieldId;
          return supabase.from("cms_schema_fields").update({ order: index }).eq("id", realFieldId);
        });
        await Promise.all(fieldOrderUpdates);
      }
    }

    // 5. Update section order (fallback to current state if no reorder changes)
    if (reorders.filter((r) => r.entity === "sections").length === 0) {
      const sectionOrderUpdates = payload.sectionOrder.map((sectionId, index) => {
        const realId = sectionId.startsWith("temp_") ? tempIdMap[sectionId] : sectionId;
        return supabase.from("cms_schema_sections").update({ order: index }).eq("id", realId);
      });
      await Promise.all(sectionOrderUpdates);
    }

    // 6. Update field orders within each section (fallback to current state if no reorder changes)
    if (reorders.filter((r) => r.entity === "fields").length === 0) {
      const fieldOrderUpdates = Object.entries(payload.fieldOrders).flatMap(([sectionId, fieldIds]) => {
        const realSectionId = sectionId.startsWith("temp_") ? tempIdMap[sectionId] : sectionId;
        return fieldIds.map((fieldId, index) => {
          const realFieldId = fieldId.startsWith("temp_") ? tempIdMap[fieldId] : fieldId;
          return supabase.from("cms_schema_fields").update({ order: index }).eq("id", realFieldId);
        });
      });
      await Promise.all(fieldOrderUpdates);
    }

    await initializePageContent(payload.schemaId);
    revalidatePath("/dashboard/schemas");
    return { success: true, tempIdMap };
  } catch (error) {
    console.error("Error in bulk save:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
      tempIdMap: {},
    };
  }
}
