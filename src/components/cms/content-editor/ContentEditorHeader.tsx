import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { RPCPageResponse, RPCPageSection } from "@/types/cms";
import { AlertCircle, Expand, Minimize, RotateCcw, Save } from "lucide-react";
import React from "react";

interface ContentEditorHeaderProps {
  existingContent: RPCPageResponse;
  processedSections: RPCPageSection[];
  setExpandedSections: (expandedSections: Record<string, boolean>) => void;
}

export default function ContentEditorHeader({ existingContent, processedSections, setExpandedSections }: ContentEditorHeaderProps) {
  const { hasUnsavedChanges, isSaving, saveContent, resetAllFields } = useContentEditorStore();

  const expandAllSections = () => {
    const allExpanded: Record<string, boolean> = {};
    processedSections.forEach((section) => {
      allExpanded[section.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAllSections = () => {
    const allCollapsed: Record<string, boolean> = {};
    processedSections.forEach((section) => {
      allCollapsed[section.id] = false;
    });
    setExpandedSections(allCollapsed);
  };

  const handleSave = async () => await saveContent();

  const handleReset = () => resetAllFields();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Content Editor</h1>
        <p className="text-muted-foreground">Edit content for "{existingContent.name}"</p>
      </div>

      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Unsaved changes
          </Badge>
        )}

        {/* Section Controls */}
        {processedSections.length > 1 && (
          <>
            <Button variant="ghost" size="sm" onClick={expandAllSections} className="gap-1 text-xs">
              <Expand className="h-3 w-3" />
              Expand All
            </Button>

            <Button variant="ghost" size="sm" onClick={collapseAllSections} className="gap-1 text-xs">
              <Minimize className="h-3 w-3" />
              Collapse All
            </Button>
          </>
        )}

        <Button variant="outline" onClick={handleReset} disabled={!hasUnsavedChanges || isSaving} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>

        <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving} className="gap-2">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
