import { PageOverview } from "@/components/cms/PageOverview";
import { createClient } from "@/lib/supabase/supabaseServerClient";

interface PagesPageProps {
  params: Promise<{
    websiteId: string;
  }>;
}

export default async function PagesPage({ params }: PagesPageProps) {
  const { websiteId } = await params;
  const supabase = await createClient();

  // Fetch websites with their pages
  const { data: pages, error: websitesError } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  if (websitesError) {
    console.error("Error fetching websites:", websitesError);
  }

  return (
    <div className="container mx-auto py-6">
      <PageOverview pages={pages || []} websiteId={websiteId} />
    </div>
  );
}
