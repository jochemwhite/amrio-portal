import { create } from "zustand";

interface SchemaEditorState {
  hasUnsavedChanges: boolean;
  checkUnsavedChanges: (onConfirm: () => void) => boolean;
}

export const useSchemaBuilderStore = create<SchemaEditorState>(() => ({
  hasUnsavedChanges: false,
  checkUnsavedChanges: (onConfirm) => {
    onConfirm();
    return true;
  },
}));
