"use client";

import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
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

export function UnsavedChangesDialog() {
  const {
    isUnsavedChangesDialogOpen,
    cancelUnsavedChangesDialog,
    discardChangesAndNavigate,
    saveChanges,
    isSaving,
  } = usePageBuilderStore();

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
            variant="outline"
            onClick={discardChangesAndNavigate}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard changes
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleSaveAndNavigate}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 