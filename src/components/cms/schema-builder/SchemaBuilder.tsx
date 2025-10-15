"use client";

import { Button } from "@/components/ui/button";
import { useSchemaBuilderStore } from "@/stores/useSchemaBuilderStore";
import { SupabaseSchemaWithRelations } from "@/types/cms";
import { Plus, Save, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { CmsHeader } from "../shared/cmsHeader";
import { DraggableSectionsContainer } from "./DraggableSectionsContainer";
import { NoSectionCard } from "./NoSectionCard";
import { AddSectionMenu } from "./AddSectionMenu";
import { EditSectionMenu } from "./EditSectionMenu";
import { AddFieldMenu } from "./AddFieldMenu";
import { SchemaInfo } from "./SchemaInfo";
import { SchemaSettingsDialog } from "./SchemaSettingsDialog";

interface SchemaBuilderProps {
  initialSchema: SupabaseSchemaWithRelations;
  pageId: string;
  websiteId: string;
}

export function SchemaBuilder({ initialSchema, pageId, websiteId }: SchemaBuilderProps) {
  const {
    sections,
    isSaving,
    hasUnsavedChanges,
    // Schema settings
    isSchemaSettingsOpen,
    schemaSettingsData,
    // Actions
    initializeStore,
    // Schema settings actions
    closeSchemaSettings,
    setSchemaSettingsData,
    submitSchemaSettings,
    // Section actions
    openAddSectionDialog,
    // Save/Reset actions
    saveChanges,
    resetChanges,
  } = useSchemaBuilderStore();

  // Initialize the store with schema data
  useEffect(() => {
    initializeStore(initialSchema);
  }, [initialSchema, initializeStore]);

  const handleSchemaSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSchemaSettings();
  };

  return (
    <div className="min-h-screen">
      <CmsHeader />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SchemaInfo />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button onClick={saveChanges} disabled={!hasUnsavedChanges || isSaving} variant="default">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={resetChanges} disabled={!hasUnsavedChanges || isSaving} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <Button onClick={() => openAddSectionDialog()} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {/* Content sections */}
        {sections.length === 0 ? <NoSectionCard /> : <DraggableSectionsContainer />}
      </div>

      <SchemaSettingsDialog
        isOpen={isSchemaSettingsOpen}
        isSaving={isSaving}
        formData={schemaSettingsData}
        onChange={setSchemaSettingsData}
        onClose={closeSchemaSettings}
        onSubmit={handleSchemaSettingsSubmit}
      />

      <AddFieldMenu />
      <AddSectionMenu />
      <EditSectionMenu />
    </div>
  );
}
