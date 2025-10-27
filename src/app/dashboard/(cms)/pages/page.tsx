import { PageOverview } from "@/components/cms/shared/pageOverview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { getActiveWebsiteId } from "@/lib/utils/active-website-server";
import { notFound, redirect } from "next/navigation";

export default async function PagesPage() {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();
  const activeWebsiteId = await getActiveWebsiteId();

  if (!tenantId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">No active tenant selected.</p>
        </div>
      </div>
    );
  }

  // If no active website, redirect to websites page
  if (!activeWebsiteId) {
    redirect("/dashboard/websites");
  }

  // Fetch pages for this website
  const { data: pages, error: pagesError } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("website_id", activeWebsiteId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (pagesError) {
    console.error("Error fetching pages:", pagesError);
  }

  return (
    <div className="container mx-auto py-6">
      <PageOverview pages={pages || []} websiteId={activeWebsiteId} />
    </div>
  );
}
