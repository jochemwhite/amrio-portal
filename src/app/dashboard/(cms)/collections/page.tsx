import { notFound, redirect } from "next/navigation";
import { getCollectionsByWebsite } from "@/actions/cms/collection-actions";
import { CollectionsOverview } from "@/components/cms/collections/collections_overview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantAndWebsiteIds } from "@/server/utils";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();
 
  
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
  if (!websiteId) {
    redirect("/dashboard/websites");
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

  // Fetch collections for this website
  const collectionsResult = await getCollectionsByWebsite(websiteId);
  const collections = collectionsResult.success ? collectionsResult.data || [] : [];

  return (
    <CollectionsOverview 
      website={website} 
      initialCollections={collections}
      websiteId={websiteId}
    />
  );
}
