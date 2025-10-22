import { PageOverview } from "@/components/cms/shared/pageOverview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ websiteId: string }>;
}

export default async function WebsitePagesPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();
  
  if (!tenantId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">No active tenant selected.</p>
        </div>
      </div>
    );
  }

  // Verify the website exists and belongs to the tenant
  const { data: website, error: websiteError } = await supabase
    .from("cms_websites")
    .select("*")
    .eq("id", websiteId)
    .eq("tenant_id", tenantId)
    .single();

  if (websiteError || !website) {
    console.error("Error fetching website:", websiteError);
    notFound();
  }

  // Fetch pages for this website
  const { data: pages, error: pagesError } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("website_id", websiteId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (pagesError) {
    console.error("Error fetching pages:", pagesError);
  }

  return (
    <div className="container mx-auto py-6">
      <PageOverview pages={pages || []} websiteId={websiteId} />
    </div>
  );
}

