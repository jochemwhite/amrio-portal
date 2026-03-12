import { PageOverview } from "@/components/cms/pages/page-overview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACTIVE_TENANT_COOKIE  = "active-tenant";
const ACTIVE_WEBSITE_COOKIE = "active-website";

export default async function PagesPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const tenantId  = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const websiteId = cookieStore.get(ACTIVE_WEBSITE_COOKIE)?.value;

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">No active tenant selected.</p>
      </div>
    );
  }

  if (!websiteId) {
    redirect("/dashboard/websites");
  }

  const { data: pagesData, error } = await supabase
    .from("cms_pages")
    .select("*, cms_content_sections(count)")
    .eq("website_id", websiteId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pages:", error);
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Failed to load pages. Please try again.</p>
      </div>
    );
  }

  const pages = (pagesData ?? []).map(({ cms_content_sections, ...page }) => ({
    ...page,
    cms_content_sections: cms_content_sections?.[0]?.count ?? 0,
  }));

  return (
    <div className="container mx-auto py-6">
      <PageOverview pages={pages} websiteId={websiteId} />
    </div>
  );
}