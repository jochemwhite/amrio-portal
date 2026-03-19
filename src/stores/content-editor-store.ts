import { RPCPageField, RPCPageSection, SupabaseField } from "@/types/cms";
import { FIELD_TYPES } from "@/utils/schema/field_types";
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

const normalizeFieldContent = (content: any) => {
  if (content && typeof content === "object" && "value" in content) {
    return content.value;
  }
  return content;
};

export interface FieldComponentProps {
  field: RPCPageField;
  fieldId: string;
  value: any;
  handleFieldChange: (fieldId: string, value: any) => void;
  currentSection?: RPCPageSection;
  allSections?: RPCPageSection[];
}

// Type for the save function that handles the actual save operation
export type SaveContentFunction = (updatedFields: string) => Promise<{ success: boolean; message?: string; error?: string }>;

interface ContentEditorState {
  // Core data
  originalFields: FieldWithValue[]; // Flattened array of all original fields
  updatedFields: {
    id: string; // schema field ID
    content: any;
    type: string;
    content_field_id?: string | null; // actual content field ID for updates
  }[]; // Only fields that have been modified (delta tracking)
  websiteId: string | null; // Current website ID

  // UI state
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Callbacks
  saveFn?: SaveContentFunction; // Function that handles the actual save operation

  // Actions
  initializeContent: (originalFields: FieldWithValue[], websiteId?: string | null) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  getFieldComponent: (field: RPCPageField) => React.ComponentType<FieldComponentProps> | null;
  getFieldCollectionId: (fieldId: string) => string | null;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  saveContent: () => Promise<void>;
  setSaveFunction: (saveFn: SaveContentFunction) => void;
  setWebsiteId: (websiteId: string | null) => void;
}

export const useContentEditorStore = create<ContentEditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      updatedFields: [],
      originalFields: [],
      websiteId: null,
      hasUnsavedChanges: false,
      isSaving: false,
      isLoading: false,
      saveFn: undefined,
      onSaveCallback: undefined,

      // Initialize store with page data
      initializeContent: (originalFields: FieldWithValue[], websiteId: string | null = null) => {
        set(
          {
            originalFields: originalFields, // Store flattened fields only
            updatedFields: [], // Start with no changes
            hasUnsavedChanges: false,
            websiteId: websiteId,
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
          return normalizeFieldContent(updatedField.content);
        }

        // Otherwise, get value from original fields (flattened array)
        const originalField = state.originalFields.find((f) => f.id === fieldId);
        return normalizeFieldContent(originalField?.content);
      },

      // Get a field component
      getFieldComponent: (field: SupabaseField | RPCPageField) => {
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
        const { updatedFields, saveFn } = get();

        if (updatedFields.length === 0) {
          toast.info("No changes to save");
          return;
        }

        if (!saveFn) {
          toast.error("No save function configured. Please set a save function using setSaveFunction.");
          console.error("No save function configured. Use setSaveFunction to set a save function before calling saveContent.");
          return;
        }

        set({ isSaving: true }, false, "savingContent");

        try {
          // Call the dynamic save function
          const result = await saveFn(JSON.stringify(updatedFields));

          if (!result.success) {
            throw new Error(result.error || "Failed to save content");
          }

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

          toast.success(result.message || "Content saved successfully");
        } catch (error) {
          console.error("Error saving content:", error);
          toast.error(error instanceof Error ? error.message : "Failed to save content");
          set({ isSaving: false }, false, "saveContentError");
        }
      },

      // Set the save function
      setSaveFunction: (saveFn: SaveContentFunction) => {
        set({ saveFn }, false, "setSaveFunction");
      },

      // Set website ID
      setWebsiteId: (websiteId: string | null) => {
        set({ websiteId }, false, "setWebsiteId");
      },
    }),
    {
      name: "content-editor-store",
      enabled: process.env.NODE_ENV === "development", // Only enable in development
      anonymousActionType: "content-editor-action", // Name for anonymous actions
    }
  )
);
