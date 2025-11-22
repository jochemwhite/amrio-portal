import { Suspense } from "react";
import { LayoutContentManager } from "@/components/cms/layouts/LayoutContentManager";
import { getAllLayoutsForWebsite } from "@/actions/cms/layout-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cookies } from "next/headers";
import { getActiveWebsiteId } from "@/lib/utils/active-website-server";

export default async function LayoutPage() {
  // Get active website from cookies
  const activeWebsiteId = await getActiveWebsiteId();

  if (!activeWebsiteId) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold">Page Layout Settings</h1>
          <p className="text-muted-foreground">
            Manage headers and footers for your website
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a website to view layout settings
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch all layouts server-side
  const layoutsResult = await getAllLayoutsForWebsite(activeWebsiteId);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">Page Layout Settings</h1>
        <p className="text-muted-foreground">
          Manage headers and footers for your website
        </p>
      </div>

      {layoutsResult.success && layoutsResult.data ? (
        <LayoutContentManager 
          initialLayouts={layoutsResult.data} 
          websiteId={activeWebsiteId}
        />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {layoutsResult.error || "Failed to load layouts"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
