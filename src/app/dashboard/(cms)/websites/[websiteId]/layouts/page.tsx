import { getLayoutTemplatesByWebsite } from "@/actions/cms/layout-actions";
import { LayoutTemplatesList } from "@/components/cms/layouts/LayoutTemplatesList";
import { getActiveTenantId } from "@/server/utils";
import { redirect } from "next/navigation";

interface LayoutsPageProps {
  params: Promise<{ websiteId: string }>;
}

export default async function LayoutsPage({ params }: LayoutsPageProps) {
  const { websiteId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch both header and footer templates
  const headersResult = await getLayoutTemplatesByWebsite(websiteId, "header");
  const footersResult = await getLayoutTemplatesByWebsite(websiteId, "footer");

  const headers = headersResult.success ? headersResult.data : [];
  const footers = footersResult.success ? footersResult.data : [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Headers & Footers</h1>
        <p className="text-muted-foreground mt-2">
          Manage your website's header and footer templates with conditional assignments
        </p>
      </div>

      <LayoutTemplatesList 
        websiteId={websiteId} 
        initialHeaders={headers} 
        initialFooters={footers} 
      />
    </div>
  );
}


