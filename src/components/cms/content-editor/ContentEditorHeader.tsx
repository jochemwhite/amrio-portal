import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContentEditorStore } from "@/stores/content-editor-store";
import { RPCPageSection } from "@/types/cms";
import { AlertCircle, Expand, Minimize, RotateCcw, Save } from "lucide-react";
import React, { ReactNode } from "react";
import { toast } from "sonner";

interface ContentEditorHeaderProps {
  title: string;
  description?: string;
  processedSections: RPCPageSection[];
  setExpandedSections: (expandedSections: Record<string, boolean>) => void;
  children?: ReactNode;
}

export default function ContentEditorHeader({ title, description, processedSections, setExpandedSections, children }: ContentEditorHeaderProps) {
  const { hasUnsavedChanges, isSaving,  resetAllFields } = useContentEditorStore();

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

  const handleSave = async () => {
    toast.info("TODO SAVE")
  }

  const handleReset = () => resetAllFields();

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
        {children}
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
