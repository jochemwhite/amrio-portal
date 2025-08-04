import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";

export const PageInfo = () => {
  const { page, sections, openPageSettings } = usePageBuilderStore();

  return (
    <Card className="mb-8 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium ">Page Settings</h2>
          <Button variant="ghost" size="sm" onClick={openPageSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ">
          <div>
            <span className="font-medium">Slug:</span> /{page?.slug}
          </div>
          <div>
            <span className="font-medium">Created:</span> {page?.created_at ? new Date(page.created_at).toLocaleDateString() : "Unknown"}
          </div>
          <div>
            <span className="font-medium">Sections:</span> {sections.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
