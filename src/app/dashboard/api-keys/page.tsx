import { redirect } from "next/navigation";
import { getActiveTenantId } from "@/server/utils";
import { getApiKeys } from "@/actions/api-keys/api_key_actions";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";
import { ApiKeysManagement } from "@/components/api-keys/api_keys_management";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Manage API keys for programmatic access to your CMS data.",
};

export default async function api_keys_page() {
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch API keys and websites for the active tenant
  const [apiKeysResult, websitesResult] = await Promise.all([
    getApiKeys(),
    getWebsitesByTenant(tenantId),
  ]);

  if (!apiKeysResult.success) {
    console.error("Error fetching API keys:", apiKeysResult.error);
  }

  if (!websitesResult.success) {
    console.error("Error fetching websites:", websitesResult.error);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Manage API keys for accessing your CMS data programmatically.
        </p>
      </div>

      <ApiKeysManagement
        initialApiKeys={apiKeysResult.data || []}
        availableWebsites={websitesResult.data || []}
      />
    </div>
  );
}
