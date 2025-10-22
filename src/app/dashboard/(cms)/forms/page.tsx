import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantId } from "@/server/utils";
import { getActiveWebsiteId } from "@/lib/utils/active-website-server";
import { notFound, redirect } from "next/navigation";

export default async function FormsPage() {
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

  // Verify the website exists and belongs to the tenant
  const { data: website, error: websiteError } = await supabase
    .from("cms_websites")
    .select("*")
    .eq("id", activeWebsiteId)
    .eq("tenant_id", tenantId)
    .single();

  if (websiteError || !website) {
    console.error("Error fetching website:", websiteError);
    notFound();
  }

  // TODO: Fetch forms for this website
  // const { data: forms, error: formsError } = await supabase
  //   .from("cms_forms")
  //   .select("*")
  //   .eq("website_id", activeWebsiteId)
  //   .eq("tenant_id", tenantId)
  //   .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Forms</h1>
        <p className="text-muted-foreground">Forms for {website.name}</p>
        {/* TODO: Add forms overview component */}
      </div>
    </div>
  );
}
