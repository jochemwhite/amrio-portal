"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";

export function SchemaUnsavedChangesDialog() {
  const {
    isUnsavedChangesDialogOpen,
    cancelUnsavedChangesDialog,
    discardChangesAndNavigate,
    saveChanges,
    isSaving,
  } = useSchemaBuilderStore();

  const handleSaveAndNavigate = async () => {
    try {
      await saveChanges();
      discardChangesAndNavigate();
    } catch (error) {
      // Error handling is already done in saveChanges
      console.error("Failed to save changes:", error);
    }
  };

  return (
    <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={cancelUnsavedChangesDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave this page? You have unsaved changes that will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelUnsavedChangesDialog}>
            Stay on page
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={discardChangesAndNavigate}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard changes
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleSaveAndNavigate}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

