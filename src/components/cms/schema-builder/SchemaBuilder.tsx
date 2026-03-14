"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseSchemaWithRelations } from "@/types/cms";
import { Plus, Save, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
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
  // FIX #7: Use useShallow to batch all selectors into a single subscription,
  // avoiding multiple re-renders from individual selector calls.
  const {
    isSaving,
    hasUnsavedChanges,
    pendingChanges,
    isSchemaSettingsOpen,
    schemaSettingsData,
    initializeStore,
    closeSchemaSettings,
    setSchemaSettingsData,
    submitSchemaSettings,
    openAddSectionDialog,
    saveChanges,
    resetChanges,
  } = useSchemaBuilderStore(
    useShallow((state) => ({
      isSaving: state.isSaving,
      hasUnsavedChanges: state.hasUnsavedChanges,
      pendingChanges: state.pendingChanges,
      isSchemaSettingsOpen: state.isSchemaSettingsOpen,
      schemaSettingsData: state.schemaSettingsData,
      initializeStore: state.initializeStore,
      closeSchemaSettings: state.closeSchemaSettings,
      setSchemaSettingsData: state.setSchemaSettingsData,
      submitSchemaSettings: state.submitSchemaSettings,
      openAddSectionDialog: state.openAddSectionDialog,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
    })),
  );

  // Enable unsaved changes protection (navigation blocking)
  useSchemaUnsavedChangesProtection();

  // FIX #9: Use initialSchema.id as the dependency instead of the full object
  // to prevent re-initializing on every parent render when the object reference changes.
  useEffect(() => {
    initializeStore(initialSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSchema.id]);

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
        <DraggableSectionsContainer />
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