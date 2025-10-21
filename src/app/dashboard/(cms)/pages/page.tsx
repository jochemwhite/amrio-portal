import { PageOverview } from "@/components/cms/shared/pageOverview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";

export default async function PagesPage() {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  // Fetch websites with their pages
  const { data: pages, error: websitesError } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (websitesError) {
    console.error("Error fetching websites:", websitesError);
  }
  
  const websiteId = pages;

  console.log("Website ID", websiteId);


  if (!websiteId) {
    return { success: false, error: "No website selected." };
  }


  return (
    <div className="container mx-auto py-6">
      <PageOverview pages={pages || []} websiteId={pages?.[0]?.website_id || ""} />
    </div>
  );
}
