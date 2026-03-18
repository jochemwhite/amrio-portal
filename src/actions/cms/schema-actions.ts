"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Schema, SchemaSection, SupabaseSchemaWithRelations } from "@/types/cms";
import { SchemaSavePayload } from "@/types/schema_builder";
import type { Database, Json } from "@/types/supabase";
import { randomUUID } from "crypto";

type BaseSchemaMutationPayload = {
  description?: string;
  template?: boolean;
  schema_type?: Database["public"]["Enums"]["schema_type"];
};

type CreateSchemaPayload = BaseSchemaMutationPayload & {
  name: string;
};

type UpdateSchemaPayload = BaseSchemaMutationPayload & {
  name?: string;
};

export async function getSchemaById(schemaId: string): Promise<ActionResponse<Schema>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  return fetch_schema_by_id(schemaId, context.tenantId);
}

export async function getAllSchemas(): Promise<ActionResponse<Schema[]>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  try {
    const { data, error } = await supabaseAdmin
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
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .order("order", { ascending: true, referencedTable: "cms_schema_sections" })
      .order("order", { ascending: true, referencedTable: "cms_schema_sections.cms_schema_fields" });

    if (error) {
      console.error("Error fetching schemas:", error);
      return { success: false, error: error.message };
    }

    const schemas =
      (data as SupabaseSchemaWithRelations[] | null)?.map((schema) =>
        normalize_schema(schema)
      ) ?? [];

    return { success: true, data: schemas };
  } catch (error) {
    console.error("Unexpected error fetching schemas:", error);
    return { success: false, error: "An unexpected error occurred while loading schemas." };
  }
}

export async function createSchema(
  payload: CreateSchemaPayload
): Promise<ActionResponse<Schema>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  const name = payload.name?.trim() ?? "";
  if (!name) {
    return { success: false, error: "Schema name is required." };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("cms_schemas")
      .insert({
        name,
        description: payload.description?.trim() || null,
        template: payload.template ?? false,
        schema_type: payload.schema_type ?? "page",
        tenant_id: context.tenantId,
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating schema:", error);
      return { success: false, error: error.message };
    }

    return fetch_schema_by_id(data.id, context.tenantId);
  } catch (error) {
    console.error("Unexpected error creating schema:", error);
    return { success: false, error: "An unexpected error occurred while creating schema." };
  }
}

export async function updateSchema(
  schemaId: string,
  payload: UpdateSchemaPayload
): Promise<ActionResponse<Schema>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  const schemaResponse = await fetch_schema_by_id(schemaId, context.tenantId);
  if (!schemaResponse.success || !schemaResponse.data) {
    return {
      success: false,
      error: schemaResponse.error ?? "Schema not found.",
    };
  }

  const updateValues: Database["public"]["Tables"]["cms_schemas"]["Update"] = {};

  if (payload.name !== undefined) {
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Schema name is required." };
    }
    updateValues.name = trimmedName;
  }

  if (payload.description !== undefined) {
    updateValues.description = payload.description.trim() || null;
  }

  if (payload.template !== undefined) {
    updateValues.template = payload.template;
  }

  if (payload.schema_type !== undefined) {
    updateValues.schema_type = payload.schema_type;
  }

  if (Object.keys(updateValues).length === 0) {
    return { success: true, data: schemaResponse.data };
  }

  try {
    const { error } = await supabaseAdmin
      .from("cms_schemas")
      .update(updateValues)
      .eq("id", schemaId)
      .eq("tenant_id", context.tenantId);

    if (error) {
      console.error("Error updating schema:", error);
      return { success: false, error: error.message };
    }

    return fetch_schema_by_id(schemaId, context.tenantId);
  } catch (error) {
    console.error("Unexpected error updating schema:", error);
    return { success: false, error: "An unexpected error occurred while updating schema." };
  }
}

export async function deleteSchema(schemaId: string): Promise<ActionResponse<void>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  try {
    const { error } = await supabaseAdmin
      .from("cms_schemas")
      .delete()
      .eq("id", schemaId)
      .eq("tenant_id", context.tenantId);

    if (error) {
      console.error("Error deleting schema:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting schema:", error);
    return { success: false, error: "An unexpected error occurred while deleting schema." };
  }
}

export async function updateSchemaStructure(
  schemaId: string,
  payload: SchemaSavePayload
): Promise<ActionResponse<Schema>> {
  const context = await get_authorized_context();
  if (!context.success) {
    return { success: false, error: context.error };
  }

  const schemaResponse = await fetch_schema_by_id(schemaId, context.tenantId);
  if (!schemaResponse.success || !schemaResponse.data) {
    return {
      success: false,
      error: schemaResponse.error ?? "Schema not found.",
    };
  }

  const validation = validate_schema_payload(schemaResponse.data, payload);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  try {
    const { error: schemaUpdateError } = await supabaseAdmin
      .from("cms_schemas")
      .update({
        name: payload.schema.name,
        description: payload.schema.description,
        template: payload.schema.template,
      })
      .eq("id", schemaId)
      .eq("tenant_id", context.tenantId);

    if (schemaUpdateError) {
      console.error("Error updating schema details:", schemaUpdateError);
      return { success: false, error: schemaUpdateError.message };
    }

    const currentSections = schemaResponse.data.cms_schema_sections ?? [];
    const currentSectionIds = new Set(currentSections.map((section) => section.id));
    const submittedSectionIds = new Set(payload.sections.map((section) => section.id));
    const sectionsToDelete = currentSections.filter((section) => !submittedSectionIds.has(section.id));

    const currentFields = (schemaResponse.data.cms_schema_sections ?? []).flatMap(
      (section) => section.cms_schema_fields ?? []
    );
    const currentFieldIds = new Set(currentFields.map((field) => field.id));
    const submittedFieldIds = new Set(payload.fields.map((field) => field.id));
    const fieldsToDelete = currentFields.filter((field) => !submittedFieldIds.has(field.id));
    const sortedFieldsToDelete = sort_fields_for_deletion(fieldsToDelete, currentFields);

    for (const field of sortedFieldsToDelete) {
      const { error } = await supabaseAdmin.from("cms_schema_fields").delete().eq("id", field.id);

      if (error) {
        console.error("Error deleting schema field:", error);
        return { success: false, error: error.message };
      }
    }

    for (const section of payload.sections) {
      const sectionValues = {
        order: section.order,
        name: section.name,
        description: section.description,
      };

      const { error } = currentSectionIds.has(section.id)
        ? await supabaseAdmin
            .from("cms_schema_sections")
            .update(sectionValues)
            .eq("id", section.id)
            .eq("schema_id", schemaId)
        : await supabaseAdmin
            .from("cms_schema_sections")
            .insert({
              id: section.id,
              schema_id: schemaId,
              ...sectionValues,
            });

      if (error) {
        console.error("Error updating schema section:", error);
        return { success: false, error: error.message };
      }
    }

    for (const field of payload.fields) {
      const fieldValues: Omit<Database["public"]["Tables"]["cms_schema_fields"]["Insert"], "id"> = {
        name: field.name,
        field_key: field.fieldKey,
        type: field.type as Database["public"]["Enums"]["field_type"],
        required: field.required,
        default_value: field.defaultValue,
        validation: field.validation,
        settings: to_supabase_json(field.settings),
        collection_id: field.collectionId,
        order: field.order,
        parent_field_id: field.parentFieldId,
        schema_section_id: field.schemaSectionId,
      };

      const { error } = currentFieldIds.has(field.id)
        ? await supabaseAdmin
            .from("cms_schema_fields")
            .update(fieldValues)
            .eq("id", field.id)
        : await supabaseAdmin
            .from("cms_schema_fields")
            .insert({
              id: field.id,
              ...fieldValues,
            });

      if (error) {
        console.error("Error updating schema field:", error);
        return { success: false, error: error.message };
      }
    }

    for (const section of sectionsToDelete) {
      const { error } = await supabaseAdmin
        .from("cms_schema_sections")
        .delete()
        .eq("id", section.id)
        .eq("schema_id", schemaId);

      if (error) {
        console.error("Error deleting schema section:", error);
        return { success: false, error: error.message };
      }
    }

    return fetch_schema_by_id(schemaId, context.tenantId);
  } catch (error) {
    console.error("Unexpected error updating schema structure:", error);
    return { success: false, error: "An unexpected error occurred while saving." };
  }
}

export async function syncSchemaDraft(payload: {
  schemaId: string;
  sections: SchemaSection[];
}): Promise<ActionResponse<{ schema: Schema; tempIdMap: Record<string, string> }>> {
  const schemaResponse = await getSchemaById(payload.schemaId);
  if (!schemaResponse.success || !schemaResponse.data) {
    return { success: false, error: schemaResponse.error ?? "Schema not found." };
  }

  const tempIdMap: Record<string, string> = {};
  for (const section of payload.sections) {
    if (section.id.startsWith("temp_")) {
      tempIdMap[section.id] = randomUUID();
    }

    for (const field of section.cms_schema_fields ?? []) {
      if (field.id.startsWith("temp_")) {
        tempIdMap[field.id] = randomUUID();
      }
    }
  }

  const savePayload: SchemaSavePayload = {
    schema: {
      name: schemaResponse.data.name,
      description: schemaResponse.data.description ?? null,
      template: schemaResponse.data.template,
    },
    sections: payload.sections.map((section, index) => ({
      id: tempIdMap[section.id] ?? section.id,
      order: section.order ?? index,
      name: section.name,
      description: section.description ?? null,
    })),
    fields: payload.sections.flatMap((section) =>
      (section.cms_schema_fields ?? []).map((field, index) => ({
        id: tempIdMap[field.id] ?? field.id,
        order: field.order ?? index,
        schemaSectionId:
          tempIdMap[field.schema_section_id] ?? tempIdMap[section.id] ?? field.schema_section_id,
        parentFieldId: field.parent_field_id
          ? tempIdMap[field.parent_field_id] ?? field.parent_field_id
          : null,
        name: field.name,
        fieldKey: field.field_key,
        type: field.type,
        required: field.required,
        defaultValue: field.default_value ?? null,
        validation: field.validation ?? null,
        settings: (field.settings ?? null) as Record<string, unknown> | null,
        collectionId: field.collection_id ?? null,
      }))
    ),
  };

  const result = await updateSchemaStructure(payload.schemaId, savePayload);
  if (!result.success || !result.data) {
    return { success: false, error: result.error ?? "Failed to save schema draft." };
  }

  return {
    success: true,
    data: {
      schema: result.data,
      tempIdMap,
    },
  };
}

async function get_authorized_context(): Promise<
  | { success: true; tenantId: string; userId: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can manage schemas." };
  }

  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  return { success: true, tenantId, userId: user.id };
}

async function fetch_schema_by_id(
  schemaId: string,
  tenantId: string
): Promise<ActionResponse<Schema>> {
  try {
    const { data, error } = await supabaseAdmin
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
      if (is_schema_lookup_not_found_error(error)) {
        return { success: false, error: "Schema not found." };
      }

      console.error("Error fetching schema:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Schema not found." };
    }

    return {
      success: true,
      data: normalize_schema(data as SupabaseSchemaWithRelations),
    };
  } catch (error) {
    if (is_schema_lookup_not_found_error(error)) {
      return { success: false, error: "Schema not found." };
    }

    console.error("Unexpected error fetching schema:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

function is_schema_lookup_not_found_error(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dbError = error as {
    code?: string | null;
    message?: string | null;
  };

  const errorCode = dbError.code ?? "";
  const errorMessage = dbError.message?.toLowerCase() ?? "";

  // `22P02` is an invalid UUID cast error. For route param lookup this effectively means "not found".
  if (errorCode === "22P02") {
    return true;
  }

  // Supabase/PostgREST no-row responses for `.single()`.
  if (errorCode === "PGRST116") {
    return true;
  }

  if (errorMessage.includes("multiple (or no) rows returned")) {
    return true;
  }

  return false;
}

function normalize_schema(schema: SupabaseSchemaWithRelations): Schema {
  return {
    ...schema,
    created_at: schema.created_at ?? undefined,
    updated_at: schema.updated_at ?? undefined,
    cms_schema_sections: [...schema.cms_schema_sections]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((section) => ({
        ...section,
        description: section.description ?? null,
        order: section.order ?? 0,
        schema_id: section.schema_id ?? schema.id,
        created_at: section.created_at ?? undefined,
        updated_at: section.updated_at ?? undefined,
        cms_schema_fields: [...section.cms_schema_fields]
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
          .map((field) => ({
            ...field,
            default_value: field.default_value ?? null,
            validation: field.validation ?? null,
            settings: field.settings ?? null,
            order: field.order ?? 0,
            parent_field_id: field.parent_field_id ?? null,
            schema_section_id: field.schema_section_id ?? section.id,
            collection_id: field.collection_id ?? null,
            created_at: field.created_at ?? undefined,
            updated_at: field.updated_at ?? undefined,
          })),
      })),
  };
}

function validate_schema_payload(
  schema: Schema,
  payload: SchemaSavePayload
): { success: true } | { success: false; error: string } {
  if (!payload.schema.name.trim()) {
    return { success: false, error: "Schema name is required." };
  }

  const submittedSectionIds = new Set(payload.sections.map((section) => section.id));
  const nestedSectionFieldIds = new Set<string>();
  const sectionIdByFieldId = new Map<string, string>();

  if (!has_unique_ids(payload.sections.map((section) => section.id))) {
    return { success: false, error: "Duplicate section IDs were submitted." };
  }

  if (!has_unique_ids(payload.fields.map((field) => field.id))) {
    return { success: false, error: "Duplicate field IDs were submitted." };
  }

  for (const section of payload.sections) {
    if (!section.name.trim()) {
      return { success: false, error: "A section was submitted without a name." };
    }
  }

  for (const field of payload.fields) {
    if (!submittedSectionIds.has(field.schemaSectionId)) {
      return { success: false, error: "A field was assigned to an invalid section." };
    }

    if (!field.name.trim()) {
      return { success: false, error: "A field was submitted without a name." };
    }

    if (!field.fieldKey.trim()) {
      return { success: false, error: "A field was submitted without a field key." };
    }

    sectionIdByFieldId.set(field.id, field.schemaSectionId);
    if (field.type === "section") {
      nestedSectionFieldIds.add(field.id);
    }
  }

  for (const field of payload.fields) {
    if (!field.parentFieldId) {
      continue;
    }

    if (!nestedSectionFieldIds.has(field.parentFieldId)) {
      return { success: false, error: "A field was assigned to an invalid nested section." };
    }

    const parentSectionId = sectionIdByFieldId.get(field.parentFieldId);
    if (parentSectionId !== field.schemaSectionId) {
      return {
        success: false,
        error: "Nested fields must stay inside the same top-level section as their parent.",
      };
    }
  }

  const parentFieldIdByFieldId = new Map(
    payload.fields.map((field) => [field.id, field.parentFieldId ?? null])
  );

  for (const nestedSectionFieldId of nestedSectionFieldIds) {
    const visitedFieldIds = new Set<string>();
    let currentFieldId: string | null = nestedSectionFieldId;

    while (currentFieldId) {
      if (visitedFieldIds.has(currentFieldId)) {
        return { success: false, error: "Nested sections cannot contain circular parent references." };
      }

      visitedFieldIds.add(currentFieldId);
      currentFieldId = parentFieldIdByFieldId.get(currentFieldId) ?? null;
    }
  }

  return { success: true };
}

function has_unique_ids(ids: string[]) {
  return new Set(ids).size === ids.length;
}

function to_supabase_json(value: Record<string, unknown> | null): Json | null {
  return (value ?? null) as Json | null;
}

function sort_fields_for_deletion(
  fieldsToDelete: Array<{ id: string }>,
  allCurrentFields: Array<{ id: string; parent_field_id?: string | null }>
) {
  const parentById = new Map<string, string | null>(
    allCurrentFields.map(
      (field): [string, string | null] => [field.id, field.parent_field_id ?? null]
    )
  );

  return [...fieldsToDelete].sort((left, right) => {
    const leftDepth = get_field_depth(left.id, parentById);
    const rightDepth = get_field_depth(right.id, parentById);
    return rightDepth - leftDepth;
  });
}

function get_field_depth(fieldId: string, parentById: Map<string, string | null>) {
  let depth = 0;
  let currentId: string | null = fieldId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);
    const parentId: string | null = parentById.get(currentId) ?? null;
    if (!parentId) {
      break;
    }

    depth += 1;
    currentId = parentId;
  }

  return depth;
}
