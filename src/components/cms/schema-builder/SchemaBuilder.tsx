"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseSchemaWithRelations } from "@/types/cms";
import { Plus, Save, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { DraggableSectionsContainer } from "./DraggableSectionsContainer";
import { AddSectionMenu } from "./AddSectionMenu";
import { SchemaInfo } from "./SchemaInfo";
import { SchemaSettingsDialog } from "./SchemaSettingsDialog";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";
import { SchemaUnsavedChangesDialog } from "./SchemaUnsavedChangesDialog";
import { useSchemaUnsavedChangesProtection } from "@/hooks/useSchemaUnsavedChangesProtection";
import { AddFieldMenu } from "./AddFieldMenu";

interface SchemaBuilderProps {
  initialSchema: SupabaseSchemaWithRelations;
  pageId: string;
  websiteId: string;
}

export function SchemaBuilder({
  initialSchema,
  pageId,
  websiteId,
}: SchemaBuilderProps) {
  // Use explicit selectors to ensure proper re-renders on state changes
  const sections = useSchemaBuilderStore((state) => state.sections);
  const isSaving = useSchemaBuilderStore((state) => state.isSaving);
  const hasUnsavedChanges = useSchemaBuilderStore(
    (state) => state.hasUnsavedChanges,
  );
  const pendingChanges = useSchemaBuilderStore((state) => state.pendingChanges);
  const isSchemaSettingsOpen = useSchemaBuilderStore(
    (state) => state.isSchemaSettingsOpen,
  );
  const schemaSettingsData = useSchemaBuilderStore(
    (state) => state.schemaSettingsData,
  );
  const initializeStore = useSchemaBuilderStore(
    (state) => state.initializeStore,
  );
  const closeSchemaSettings = useSchemaBuilderStore(
    (state) => state.closeSchemaSettings,
  );
  const setSchemaSettingsData = useSchemaBuilderStore(
    (state) => state.setSchemaSettingsData,
  );
  const submitSchemaSettings = useSchemaBuilderStore(
    (state) => state.submitSchemaSettings,
  );
  const openAddSectionDialog = useSchemaBuilderStore(
    (state) => state.openAddSectionDialog,
  );
  const saveChanges = useSchemaBuilderStore((state) => state.saveChanges);
  const resetChanges = useSchemaBuilderStore((state) => state.resetChanges);

  // Enable unsaved changes protection (navigation blocking)
  useSchemaUnsavedChangesProtection();

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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SchemaInfo />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={saveChanges}
              disabled={!hasUnsavedChanges || isSaving}
              variant="default"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={resetChanges}
              disabled={!hasUnsavedChanges || isSaving}
              variant="outline"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            {pendingChanges.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingChanges.length} pending{" "}
                {pendingChanges.length === 1 ? "change" : "changes"}
              </Badge>
            )}
          </div>

          <Button onClick={() => openAddSectionDialog()} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {/* Content sections */}
        {sections.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No sections found</p>
          </div>
        ) : (
          <DraggableSectionsContainer />
        )}
      </div>

      <SchemaSettingsDialog
        isOpen={isSchemaSettingsOpen}
        isSaving={isSaving}
        formData={schemaSettingsData}
        onChange={setSchemaSettingsData}
        onClose={closeSchemaSettings}
        onSubmit={handleSchemaSettingsSubmit}
      />

      <AddSectionMenu />
      <AddFieldMenu />
      <SchemaUnsavedChangesDialog />
    </div>
  );
}
