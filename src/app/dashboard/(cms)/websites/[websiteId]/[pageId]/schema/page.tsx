import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect, notFound } from "next/navigation";
import { SchemaBuilder } from "@/components/cms/schema-builder/SchemaBuilder";
import { SupabaseSchemaWithRelations } from "@/types/cms";

interface SchemaPageProps {
  params: Promise<{
    websiteId: string;
    pageId: string;
  }>;
}

export default async function SchemaPage({ params }: SchemaPageProps) {
  const { websiteId, pageId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return redirect("/");
  }

  // Fetch page to get the schema_id
  const { data: page, error: pageError } = await supabase.from("cms_pages").select("id, name, schema_id").eq("id", pageId).single();

  if (pageError || !page) {
    console.error("Error fetching page:", pageError);
    return notFound();
  }

  // If page doesn't have a schema, we need to create one or show a message
  if (!page.schema_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Schema Assigned</h2>
          <p className="text-muted-foreground">This page doesn't have a schema assigned yet. Please assign a schema to continue.</p>
        </div>
      </div>
    );
  }

  // Fetch the schema with all its sections and fields
  const { data: schema, error: schemaError } = await supabase
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
    .eq("id", page.schema_id)
    .single();

  if (schemaError || !schema) {
    console.error("Error fetching schema:", schemaError);
    return notFound();
  }

  // Sort sections and fields by order (create new arrays to avoid mutation)
  const sortedSchema: SupabaseSchemaWithRelations = {
    ...schema,
    cms_schema_sections:
      schema.cms_schema_sections
        ?.map((section) => ({
          ...section,
          cms_schema_fields: section.cms_schema_fields 
            ? [...section.cms_schema_fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [],
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [],
  };



  return <SchemaBuilder initialSchema={sortedSchema} pageId={pageId} websiteId={websiteId} />;
}
