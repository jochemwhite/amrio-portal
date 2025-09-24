import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { ArrowLeft, Globe, Save } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { JsonPreview } from "./JsonPreview";

export const CmsHeader = () => {
  const { page, hasUnsavedChanges, isSaving, saveChanges, websiteId } = usePageBuilderStore();

  const router = useRouter();

  const handleBackToPages = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    router.push(`/dashboard/websites/${websiteId}`);
  };

  return (
    <div className=" border-b  sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBackToPages} className="flex items-center  ">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold ">{page?.name}</h1>
              <div className="flex items-center space-x-2 text-sm ">
                <Globe className="h-3 w-3" />
                <span>{page?.cms_websites?.name}</span>
                <span>•</span>
                <Badge variant={page?.status === "active" ? "default" : "secondary"}>{page?.status}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="animate-pulse">
                Unsaved
              </Badge>
            )}
            <JsonPreview />
            <Button size="sm" disabled={isSaving || !hasUnsavedChanges} onClick={() => saveChanges()}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
