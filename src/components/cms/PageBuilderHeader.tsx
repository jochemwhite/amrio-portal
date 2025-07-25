import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";

interface PageBuilderHeaderProps {
  page: any;
  websiteId: string;
  hasUnsavedChanges: boolean;
  onBack: () => void;
}

export function PageBuilderHeader({ page, websiteId, hasUnsavedChanges, onBack }: PageBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pages
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{page?.name} - Page Builder</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={page?.status === "active" ? "default" : page?.status === "draft" ? "secondary" : "outline"}>{page?.status}</Badge>
            <span className="text-sm text-muted-foreground">/{page?.slug}</span>
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="mr-1 h-3 w-3" />
              {page?.cms_websites?.name}
            </div>
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="animate-pulse">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 