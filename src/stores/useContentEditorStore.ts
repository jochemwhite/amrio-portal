import { FIELD_TYPES } from "@/components/cms/shared/field-types";
import { savePageContent } from "@/actions/cms/schema-content-actions";
import { RPCPageResponse, SupabaseField } from "@/types/cms";
import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface FieldWithValue {
  id: string; // schema field ID
  type: string;
  content: any;
  content_field_id?: string | null; // actual content field ID for updates
  collection_id?: string | null; // collection id
}

interface ContentEditorState {
  // Core data
  originalFields: FieldWithValue[]; // Flattened array of all original fields
  updatedFields: {
    id: string; // schema field ID
    content: any;
    type: string;
    content_field_id?: string | null; // actual content field ID for updates
  }[]; // Only fields that have been modified (delta tracking)

  // UI state
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  initializeContent: (originalFields: FieldWithValue[]) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  getFieldComponent: (field: SupabaseField) => React.ComponentType<any> | null;
  getFieldCollectionId: (fieldId: string) => string | null;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  saveContent: () => Promise<void>;
}

export const useContentEditorStore = create<ContentEditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      updatedFields: [],
      originalFields: [],
      hasUnsavedChanges: false,
      isSaving: false,
      isLoading: false,

      // Initialize store with page data
      initializeContent: (originalFields: FieldWithValue[]) => {
        set(
          {
            originalFields: originalFields, // Store flattened fields only
            updatedFields: [], // Start with no changes
            hasUnsavedChanges: false,
          },
          false,
          "initializeContent"
        );
      },

      // Set a field value and track changes
      setFieldValue: (fieldId: string, value: any) => {
        set(
          (state) => {
            // Find the field in originalFields (flattened array)
            const originalField = state.originalFields.find((f) => f.id === fieldId);

            if (!originalField) {
              console.error(`Field ${fieldId} not found in original fields`);
              return state;
            }

            // Clone updatedFields array
            const newUpdatedFields = [...state.updatedFields];

            // Check if this field is already in updatedFields
            const existingIndex = newUpdatedFields.findIndex((f) => f.id === fieldId);

            if (existingIndex >= 0) {
              // Update existing entry
              newUpdatedFields[existingIndex] = {
                id: fieldId,
                content: value,
                type: originalField.type,
                content_field_id: originalField.content_field_id,
              };
            } else {
              // Add new entry
              newUpdatedFields.push({
                id: fieldId,
                content: value,
                type: originalField.type,
                content_field_id: originalField.content_field_id,
              });
            }

            return {
              updatedFields: newUpdatedFields,
              hasUnsavedChanges: newUpdatedFields.length > 0,
            };
          },
          false,
          "setFieldValue"
        );
      },

      // Get a field value
      getFieldValue: (fieldId: string) => {
        const state = get();

        // First check if field has been updated
        const updatedField = state.updatedFields.find((f) => f.id === fieldId);
        if (updatedField) {
          return updatedField.content;
        }

        // Otherwise, get value from original fields (flattened array)
        const originalField = state.originalFields.find((f) => f.id === fieldId);
        return originalField?.content;
      },

      // Get a field component
      getFieldComponent: (field: SupabaseField) => {
        const fieldType = FIELD_TYPES.find((type) => type.value === field.type);
        return fieldType?.cmsComponent || null;
      },

      // Get a field collection id
      getFieldCollectionId: (fieldId: string): string | null => {
        const state = get();
        const originalField = state.originalFields.find((f) => f.id === fieldId);

        if (!originalField || !originalField.collection_id || originalField.collection_id === "" || originalField.type !== "reference") {
          return null;
        }

        return originalField.collection_id;
      },

      // Reset a single field to its original value
      resetField: (fieldId: string) => {
        set(
          (state) => {
            // Remove field from updatedFields array
            const newUpdatedFields = state.updatedFields.filter((f) => f.id !== fieldId);

            return {
              updatedFields: newUpdatedFields,
              hasUnsavedChanges: newUpdatedFields.length > 0,
            };
          },
          false,
          "resetField"
        );
      },

      // Reset all fields to original values
      resetAllFields: () => {
        set(
          {
            updatedFields: [], // Clear all changes
            hasUnsavedChanges: false,
          },
          false,
          "resetAllFields"
        );
        toast.success("All changes reset");
      },

      // Save content values to the server
      saveContent: async () => {
        const { updatedFields } = get();

        if (updatedFields.length === 0) {
          toast.info("No changes to save");
          return;
        }

        set({ isSaving: true }, false, "savingContent");

        try {
          // Convert updatedFields to FieldWithValue format for savePageContent

          await savePageContent(updatedFields);

          // After successful save, update originalFields with new values and clear updatedFields
          set(
            (state) => {
              // Update the originalFields with the saved values (flattened array)
              const newOriginalFields = state.originalFields.map((field) => {
                const updatedField = state.updatedFields.find((f) => f.id === field.id);
                if (updatedField) {
                  return { ...field, content: updatedField.content };
                }
                return field;
              });

              return {
                originalFields: newOriginalFields,
                updatedFields: [], // Clear changes after save
                hasUnsavedChanges: false,
                isSaving: false,
              };
            },
            false,
            "saveContentSuccess"
          );

          toast.success("Content saved successfully");
        } catch (error) {
          console.error("Error saving content:", error);
          toast.error(error instanceof Error ? error.message : "Failed to save content");
          set({ isSaving: false }, false, "saveContentError");
        }
      },
    }),
    {
      name: "content-editor-store",
      enabled: process.env.NODE_ENV === "development", // Only enable in development
      trace: true, // Show stack traces in DevTools
      anonymousActionType: "content-editor-action", // Name for anonymous actions
    }
  )
);
