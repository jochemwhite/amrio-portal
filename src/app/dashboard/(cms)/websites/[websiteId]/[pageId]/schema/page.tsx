import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect, notFound } from "next/navigation";
import { SchemaBuilder } from "@/components/cms/schema-builder/SchemaBuilder";
import { SupabasePageWithRelations } from "@/types/cms";

interface PageBuilderProps {
  params: Promise<{
    websiteId: string;
    pageId: string;
  }>;
}

export default async function PageBuilder({ params }: PageBuilderProps) {
  const { websiteId, pageId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return redirect("/");
  }

  // Fetch page with sections and fields
  const { data: page, error: pageError } = await supabase
    .from("cms_pages")
    .select(`
      id,
      name,
      slug,
      description,
      status,
      website_id,
      created_at,
      updated_at,
      cms_websites (
        id,
        name,
        domain
      ),
      cms_sections (
        id,
        name,
        description,
        page_id,
        "order",
        cms_fields (
          id,
          name,
          type,
          required,
          section_id,
          default_value,
          validation,
          "order",
          parent_field_id
        )
      )
    `)
    .eq("id", pageId)
    .eq("website_id", websiteId)
    .order("order", { referencedTable: "cms_sections", ascending: true })
    .single();

  if (pageError || !page) {
    console.error('Error fetching page:', pageError);
    return notFound();
  }

     // Sort fields within each section by order (since PostgREST can't handle nested ordering)
   const sortedPage = {
     ...page,
     status: page.status || 'draft', // Provide default value for null status
     cms_sections: page.cms_sections?.map(section => ({
       ...section,
       cms_fields: section.cms_fields?.sort((a, b) => (a.order || 0) - (b.order || 0))
     }))
   } as SupabasePageWithRelations;




  return (
    <SchemaBuilder 
      initialPage={sortedPage}
      websiteId={websiteId}
    />
  );
} 