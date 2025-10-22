import { WebsiteOverview } from "@/components/cms/shared/websiteOverview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";

export default async function PagesPage() {
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

  // Fetch websites for the active tenant
  const { data: websites, error: websitesError } = await supabase
    .from("cms_websites")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (websitesError) {
    console.error("Error fetching websites:", websitesError);
  }

  return (
    <div className="container mx-auto py-6">
      <WebsiteOverview websites={websites || []} />
    </div>
  );
}
