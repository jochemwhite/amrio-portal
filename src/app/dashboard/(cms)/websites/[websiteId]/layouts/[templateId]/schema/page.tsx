import { getLayoutTemplateById } from "@/actions/cms/layout-actions";
import { SchemaBuilder } from "@/components/cms/schema-builder/SchemaBuilder";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { SupabaseSchemaWithRelations } from "@/types/cms";
import { notFound, redirect } from "next/navigation";

interface LayoutSchemaPageProps {
  params: Promise<{ websiteId: string; templateId: string }>;
}

export default async function LayoutSchemaPage({ params }: LayoutSchemaPageProps) {
  const { websiteId, templateId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Get the layout template
  const templateResult = await getLayoutTemplateById(templateId);

  if (!templateResult.success || !templateResult.data) {
    console.error("Template not found:", templateResult.error);
    notFound();
  }

  const template = templateResult.data;

  // Fetch the schema with full relations
  const supabase = await createClient();
  const { data: schema, error: schemaError } = await supabase
    .from("cms_schemas")
    .select(
      `
      id,
      name,
      description,
      template,
      created_by,
      tenant_id,
      created_at,
      updated_at,
      cms_schema_sections (
        id,
        name,
        description,
        order,
        schema_id,
        created_at,
        updated_at,
        cms_schema_fields (
          id,
          name,
          field_key,
          type,
          required,
          default_value,
          validation,
          settings,
          order,
          parent_field_id,
          schema_section_id,
          collection_id,
          created_at,
          updated_at
        )
      )
    `
    )
    .eq("id", template.schema_id)
    .single();

  if (schemaError || !schema) {
    console.error("Schema not found:", schemaError);
    notFound();
  }

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">{template.name} - Schema Builder</h1>
        <p className="text-muted-foreground">
          Design the structure for your {template.type} template
        </p>
      </div>

      <SchemaBuilder
        initialSchema={schema as SupabaseSchemaWithRelations}
        pageId={templateId}
        websiteId={websiteId}
      />
    </div>
  );
}


