"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";

export interface LayoutRow {
  id: string;
  template_id: string;
  template_name: string;
  template_description: string | null;
  type: Database["public"]["Enums"]["layout_entry_type"];
  schema_id: string;
  schema_name: string;
  is_default: boolean;
  assignment_type: "default" | "assignment" | "override";
  assignment_id?: string;
  condition_type?: Database["public"]["Enums"]["layout_condition_type"];
  condition_value?: unknown;
  priority?: number;
  override_id?: string;
  page_id?: string;
  page_name?: string;
  page_slug?: string;
  created_at: string;
  updated_at: string;
}

type LayoutTemplateWithContent = {
  template: {
    id: string;
    name: string;
    type: Database["public"]["Enums"]["layout_entry_type"];
    is_default: boolean;
    created_at: string;
    layout_id: string;
    layout_name: string;
    layout_description: string | null;
  };
  schema: {
    id: string;
    name: string;
    description: string | null;
    sections: Array<{
      id: string;
      name: string;
      description: string | null;
      order: number;
      fields: Array<{
        id: string;
        name: string;
        description: string;
        type: string;
        order: number;
        required: boolean;
        validation: string;
        default_value: string;
        parent_field_id: string | null;
        collection_id: string | null;
        settings: Record<string, unknown> | null;
        content: { value?: unknown } | null;
        content_field_id: string | null;
        fields: LayoutTemplateWithContent["schema"]["sections"][number]["fields"];
      }>;
    }>;
  };
};

type SchemaFieldRow = {
  id: string;
  name: string;
  type: Database["public"]["Enums"]["field_type"];
  order: number;
  required: boolean;
  validation: string | null;
  default_value: string | null;
  parent_field_id: string | null;
  collection_id: string | null;
  settings: Record<string, unknown> | null;
  schema_section_id: string;
};

type CreateLayoutEntryData = {
  name: string;
  description?: string;
  schema_id: string;
  website_id: string;
  type: Database["public"]["Enums"]["layout_entry_type"];
  is_default?: boolean;
};

function nestSchemaFields(
  fields: SchemaFieldRow[],
  contentBySchemaFieldId: Map<string, { id: string; content: unknown }>
): LayoutTemplateWithContent["schema"]["sections"][number]["fields"] {
  const byId = new Map<
    string,
    LayoutTemplateWithContent["schema"]["sections"][number]["fields"][number]
  >();

  for (const field of fields) {
    const contentRecord = contentBySchemaFieldId.get(field.id);
    byId.set(field.id, {
      id: field.id,
      name: field.name,
      description: "",
      type: field.type,
      order: field.order,
      required: field.required,
      validation: field.validation || "",
      default_value: field.default_value || "",
      parent_field_id: field.parent_field_id,
      collection_id: field.collection_id,
      settings: field.settings,
      content: contentRecord ? ({ value: contentRecord.content } as { value?: unknown }) : null,
      content_field_id: contentRecord?.id || null,
      fields: [],
    });
  }

  const roots: LayoutTemplateWithContent["schema"]["sections"][number]["fields"] = [];

  for (const field of fields.sort((a, b) => a.order - b.order)) {
    const node = byId.get(field.id);
    if (!node) continue;

    if (field.parent_field_id) {
      const parent = byId.get(field.parent_field_id);
      if (parent) {
        parent.fields.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}

export async function createLayoutEntry(
  data: CreateLayoutEntryData
): Promise<ActionResponse<{ layout_id: string; entry_id: string }>> {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  try {
    const { data: website, error: websiteError } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("id", data.website_id)
      .eq("tenant_id", tenantId)
      .single();

    if (websiteError || !website) {
      return { success: false, error: "Website not found or access denied." };
    }

    const { data: schema, error: schemaError } = await supabase
      .from("cms_schemas")
      .select("id, schema_type, tenant_id")
      .eq("id", data.schema_id)
      .single();

    if (schemaError || !schema) {
      return { success: false, error: "Schema not found." };
    }

    if (schema.tenant_id && schema.tenant_id !== tenantId) {
      return { success: false, error: "Schema not found or access denied." };
    }

    if (String(schema.schema_type) !== "layout") {
      return { success: false, error: "Selected schema must be of type layout." };
    }

    if (data.is_default) {
      const { data: websiteLayouts, error: websiteLayoutsError } = await supabase
        .from("cms_layouts")
        .select("id")
        .eq("website_id", data.website_id);

      if (websiteLayoutsError) {
        return { success: false, error: websiteLayoutsError.message };
      }

      const websiteLayoutIds = (websiteLayouts || []).map((layout) => layout.id);
      if (websiteLayoutIds.length > 0) {
        const { error: resetDefaultError } = await supabase
          .from("cms_layout_entries")
          .update({ is_default: false })
          .eq("type", data.type)
          .eq("is_default", true)
          .in("layout_id", websiteLayoutIds);

        if (resetDefaultError) {
          return { success: false, error: resetDefaultError.message };
        }
      }
    }

    const { data: layout, error: layoutError } = await supabase
      .from("cms_layouts")
      .insert({
        name: data.name,
        description: data.description || null,
        schema_id: data.schema_id,
        website_id: data.website_id,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (layoutError || !layout) {
      return { success: false, error: layoutError?.message || "Failed to create layout." };
    }

    const { data: entry, error: entryError } = await supabase
      .from("cms_layout_entries")
      .insert({
        layout_id: layout.id,
        name: data.name,
        type: data.type,
        is_default: data.is_default || false,
      })
      .select("id")
      .single();

    if (entryError || !entry) {
      return { success: false, error: entryError?.message || "Failed to create layout entry." };
    }

    return {
      success: true,
      data: {
        layout_id: layout.id,
        entry_id: entry.id,
      },
    };
  } catch (error) {
    console.error("Unexpected error creating layout entry:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllLayoutsForWebsite(
  websiteId: string
): Promise<ActionResponse<LayoutRow[]>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data, error } = await supabase
      .from("cms_layout_entries")
      .select(
        `
        id,
        name,
        type,
        is_default,
        created_at,
        cms_layouts!inner(
          id,
          name,
          description,
          schema_id,
          website_id,
          cms_schemas!inner(
            id,
            name
          )
        )
      `
      )
      .eq("cms_layouts.website_id", websiteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching layouts:", error);
      return { success: false, error: error.message };
    }

    const rows: LayoutRow[] = (data || []).map((entry) => {
      const layout = Array.isArray(entry.cms_layouts) ? entry.cms_layouts[0] : entry.cms_layouts;
      const schema = Array.isArray(layout.cms_schemas) ? layout.cms_schemas[0] : layout.cms_schemas;

      return {
        id: entry.id,
        template_id: entry.id,
        template_name: entry.name || layout.name,
        template_description: layout.description,
        type: entry.type,
        schema_id: layout.schema_id,
        schema_name: schema?.name || "Unknown schema",
        is_default: entry.is_default,
        assignment_type: entry.is_default ? "default" : "assignment",
        created_at: entry.created_at,
        updated_at: entry.created_at,
      };
    });

    rows.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.template_name.localeCompare(b.template_name);
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error("Unexpected error fetching layouts:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getTemplateWithContent(templateId: string): Promise<ActionResponse<LayoutTemplateWithContent>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: entry, error: entryError } = await supabase
      .from("cms_layout_entries")
      .select(
        `
        id,
        name,
        type,
        is_default,
        created_at,
        layout_id,
        cms_layouts!inner(
          id,
          name,
          description,
          schema_id,
          cms_schemas!inner(
            id,
            name,
            description
          )
        )
      `
      )
      .eq("id", templateId)
      .single();

    if (entryError || !entry) {
      return { success: false, error: entryError?.message || "Layout entry not found." };
    }

    const layout = Array.isArray(entry.cms_layouts) ? entry.cms_layouts[0] : entry.cms_layouts;
    const schema = Array.isArray(layout.cms_schemas) ? layout.cms_schemas[0] : layout.cms_schemas;

    if (!layout.schema_id) {
      return { success: false, error: "Layout has no schema assigned." };
    }

    const { data: schemaSections, error: sectionsError } = await supabase
      .from("cms_schema_sections")
      .select("id, name, description, order")
      .eq("schema_id", layout.schema_id)
      .order("order", { ascending: true });

    if (sectionsError) {
      return { success: false, error: sectionsError.message };
    }

    const { data: schemaFields, error: fieldsError } = await supabase
      .from("cms_schema_fields")
      .select("id, name, type, order, required, validation, default_value, parent_field_id, collection_id, settings, schema_section_id")
      .in(
        "schema_section_id",
        (schemaSections || []).map((s) => s.id)
      )
      .order("order", { ascending: true });

    if (fieldsError) {
      return { success: false, error: fieldsError.message };
    }

    const { data: contentSections, error: contentSectionsError } = await supabase
      .from("cms_content_sections")
      .select("id, schema_section_id")
      .eq("layout_entry_id", templateId);

    if (contentSectionsError) {
      return { success: false, error: contentSectionsError.message };
    }

    const sectionIdBySchemaSectionId = new Map<string, string>();
    for (const section of contentSections || []) {
      if (section.schema_section_id) {
        sectionIdBySchemaSectionId.set(section.schema_section_id, section.id);
      }
    }

    const { data: contentFields, error: contentFieldsError } = await supabase
      .from("cms_content_fields")
      .select("id, schema_field_id, section_id, content")
      .in("section_id", (contentSections || []).map((s) => s.id));

    if (contentFieldsError) {
      return { success: false, error: contentFieldsError.message };
    }

    const contentBySectionAndSchemaField = new Map<string, { id: string; content: unknown }>();
    for (const field of contentFields || []) {
      contentBySectionAndSchemaField.set(`${field.section_id}:${field.schema_field_id}`, {
        id: field.id,
        content: field.content,
      });
    }

    const sectionPayload = (schemaSections || []).map((section) => {
      const sectionFields = (schemaFields || []).filter((f) => f.schema_section_id === section.id) as SchemaFieldRow[];
      const contentSectionId = sectionIdBySchemaSectionId.get(section.id);

      const contentBySchemaFieldId = new Map<string, { id: string; content: unknown }>();
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
        description: section.description,
        order: section.order || 0,
        fields: nestSchemaFields(sectionFields, contentBySchemaFieldId),
      };
    });

    const payload: LayoutTemplateWithContent = {
      template: {
        id: entry.id,
        name: entry.name || layout.name,
        type: entry.type,
        is_default: entry.is_default,
        created_at: entry.created_at,
        layout_id: layout.id,
        layout_name: layout.name,
        layout_description: layout.description,
      },
      schema: {
        id: schema.id,
        name: schema.name,
        description: schema.description,
        sections: sectionPayload,
      },
    };

    return { success: true, data: payload };
  } catch (error) {
    console.error("Unexpected error fetching layout template with content:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function saveLayoutTemplateContent(
  templateId: string,
  updatedFieldsJSON: string
): Promise<ActionResponse<void>> {
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
    return { success: false, error: "Unauthorized: Only admins can save layout content." };
  }

  try {
    const updatedFields = JSON.parse(updatedFieldsJSON) as Array<{
      schema_field_id: string;
      content: unknown;
      content_field_id?: string | null;
    }>;

    if (updatedFields.length === 0) {
      return { success: true };
    }

    const schemaFieldIds = [...new Set(updatedFields.map((f) => f.schema_field_id))];

    const { data: schemaFields, error: schemaFieldsError } = await supabase
      .from("cms_schema_fields")
      .select("id, schema_section_id, name, type, order, parent_field_id")
      .in("id", schemaFieldIds);

    if (schemaFieldsError || !schemaFields) {
      return { success: false, error: schemaFieldsError?.message || "Failed to load schema fields." };
    }

    const sectionIds = [...new Set(schemaFields.map((f) => f.schema_section_id))];

    const { data: sectionDefs, error: sectionDefsError } = await supabase
      .from("cms_schema_sections")
      .select("id, name, description, order")
      .in("id", sectionIds);

    if (sectionDefsError || !sectionDefs) {
      return { success: false, error: sectionDefsError?.message || "Failed to load schema sections." };
    }

    const { data: existingSections, error: existingSectionsError } = await supabase
      .from("cms_content_sections")
      .select("id, schema_section_id")
      .eq("layout_entry_id", templateId)
      .in("schema_section_id", sectionIds);

    if (existingSectionsError) {
      return { success: false, error: existingSectionsError.message };
    }

    const contentSectionBySchemaSection = new Map<string, string>();
    for (const section of existingSections || []) {
      if (section.schema_section_id) {
        contentSectionBySchemaSection.set(section.schema_section_id, section.id);
      }
    }

    const missingSections = sectionDefs.filter((s) => !contentSectionBySchemaSection.has(s.id));
    if (missingSections.length > 0) {
      const { data: insertedSections, error: insertSectionsError } = await supabase
        .from("cms_content_sections")
        .insert(
          missingSections.map((section) => ({
            layout_entry_id: templateId,
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
          contentSectionBySchemaSection.set(section.schema_section_id, section.id);
        }
      }
    }

    const sectionContentIds = [...contentSectionBySchemaSection.values()];

    const { data: existingFields, error: existingFieldsError } = await supabase
      .from("cms_content_fields")
      .select("id, section_id, schema_field_id")
      .in("section_id", sectionContentIds)
      .in("schema_field_id", schemaFieldIds);

    if (existingFieldsError) {
      return { success: false, error: existingFieldsError.message };
    }

    const existingBySectionAndSchemaField = new Map<string, string>();
    for (const field of existingFields || []) {
      existingBySectionAndSchemaField.set(`${field.section_id}:${field.schema_field_id}`, field.id);
    }

    const schemaFieldById = new Map(schemaFields.map((f) => [f.id, f]));

    for (const field of updatedFields) {
      const schemaField = schemaFieldById.get(field.schema_field_id);
      if (!schemaField) continue;

      const sectionId = contentSectionBySchemaSection.get(schemaField.schema_section_id);
      if (!sectionId) continue;

      const existingId = existingBySectionAndSchemaField.get(`${sectionId}:${field.schema_field_id}`);

      const payload: Database["public"]["Tables"]["cms_content_fields"]["Insert"] = {
        id: field.content_field_id || existingId || undefined,
        section_id: sectionId,
        schema_field_id: field.schema_field_id,
        name: schemaField.name,
        type: schemaField.type,
        order: schemaField.order,
        parent_field_id: schemaField.parent_field_id,
        content: field.content as Database["public"]["Tables"]["cms_content_fields"]["Insert"]["content"],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cms_content_fields")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving layout content:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function saveLayoutEntryContent(
  layoutEntryId: string,
  updatedFieldsJSON: string
): Promise<ActionResponse<void>> {
  try {
    const updatedFields = JSON.parse(updatedFieldsJSON) as Array<{
      id: string;
      content: unknown;
      content_field_id?: string | null;
    }>;

    const transformed = updatedFields.map((field) => ({
      schema_field_id: field.id,
      content: field.content,
      content_field_id: field.content_field_id || null,
    }));

    return saveLayoutTemplateContent(layoutEntryId, JSON.stringify(transformed));
  } catch (error) {
    console.error("Unexpected error preparing layout entry content payload:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
