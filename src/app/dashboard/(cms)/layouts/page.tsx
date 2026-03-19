import { getAllLayoutsForWebsite } from "@/actions/cms/layout-actions";
import { LayoutContentManager } from "@/components/cms/layouts/layout_content_manager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getActiveWebsiteId } from "@/server/utils";
import { AlertCircle } from "lucide-react";

export default async function LayoutsPage() {
  const websiteId = await getActiveWebsiteId();

  if (!websiteId) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold">Page Layout Settings</h1>
          <p className="text-muted-foreground">Manage headers and footers for your website</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a website to view layout settings</AlertDescription>
        </Alert>
      </div>
    );
  }

  const layoutsResult = await getAllLayoutsForWebsite(websiteId);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">Page Layout Settings</h1>
        <p className="text-muted-foreground">Manage headers and footers for your website</p>
      </div>

      {layoutsResult.success && layoutsResult.data ? (
        <LayoutContentManager initialLayouts={layoutsResult.data} websiteId={websiteId} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{layoutsResult.error || "Failed to load layouts"}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
