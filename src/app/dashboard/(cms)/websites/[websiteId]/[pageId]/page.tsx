import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect, notFound } from "next/navigation";
import { PayloadStylePageBuilder } from "@/components/cms/PayloadStylePageBuilder";

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
        cms_fields (
          id,
          name,
          type,
          required,
          section_id,
          default_value,
          validation
        )
      )
    `)
    .eq("id", pageId)
    .eq("website_id", websiteId)
    .single();

  if (pageError || !page) {
    console.error('Error fetching page:', pageError);
    return notFound();
  }

  return (
    <PayloadStylePageBuilder 
      initialPage={page}
      websiteId={websiteId}
    />
  );
} 