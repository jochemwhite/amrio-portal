import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { FIELD_TYPES } from "@/components/cms/shared/field-types";
import { saveCollectionEntryContent, updateCollectionEntry } from "@/actions/cms/collection-entry-actions";

interface FieldWithValue {
  id: string; // schema field ID
  type: string;
  content: any;
  item_id?: string | null; // actual collection item ID for updates
  required?: boolean;
}

interface CollectionEntryEditorState {
  // Core data
  originalEntryName: string;
  currentEntryName: string;
  originalFields: FieldWithValue[];
  updatedFields: {
    id: string; // schema field ID
    content: any;
    type: string;
    item_id?: string | null;
  }[];

  // UI state
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  errors: Record<string, string>;
  expandedSections: Record<string, boolean>;

  // Actions
  initializeEditor: (entryName: string, fields: FieldWithValue[]) => void;
  setEntryName: (name: string) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  getFieldComponent: (field: any) => React.ComponentType<any> | null;
  setFieldError: (fieldId: string, error: string) => void;
  clearFieldError: (fieldId: string) => void;
  validateFields: (allFields: any[]) => boolean;
  toggleSection: (sectionId: string) => void;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  saveContent: (entryId: string) => Promise<void>;
}

export const useCollectionEntryEditorStore = create<CollectionEntryEditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      originalEntryName: "",
      currentEntryName: "",
      originalFields: [],
      updatedFields: [],
      hasUnsavedChanges: false,
      isSaving: false,
      isLoading: false,
      errors: {},
      expandedSections: {},

      // Initialize editor with entry data
      initializeEditor: (entryName: string, fields: FieldWithValue[]) => {
        set(
          {
            originalEntryName: entryName,
            currentEntryName: entryName,
            originalFields: fields,
            updatedFields: [],
            hasUnsavedChanges: false,
            errors: {},
            expandedSections: {},
          },
          false,
          "initializeEditor"
        );
      },

      // Set entry name
      setEntryName: (name: string) => {
        set(
          (state) => ({
            currentEntryName: name,
            hasUnsavedChanges: name !== state.originalEntryName || state.updatedFields.length > 0,
          }),
          false,
          "setEntryName"
        );
      },

      // Set a field value and track changes
      setFieldValue: (fieldId: string, value: any) => {
        set(
          (state) => {
            const originalField = state.originalFields.find((f) => f.id === fieldId);

            if (!originalField) {
              console.error(`Field ${fieldId} not found in original fields`);
              return state;
            }

            const newUpdatedFields = [...state.updatedFields];
            const existingIndex = newUpdatedFields.findIndex((f) => f.id === fieldId);

            if (existingIndex >= 0) {
              newUpdatedFields[existingIndex] = {
                id: fieldId,
                content: value,
                type: originalField.type,
                item_id: originalField.item_id,
              };
            } else {
              newUpdatedFields.push({
                id: fieldId,
                content: value,
                type: originalField.type,
                item_id: originalField.item_id,
              });
            }

            // Clear error for this field if it exists
            const newErrors = { ...state.errors };
            delete newErrors[fieldId];

            return {
              updatedFields: newUpdatedFields,
              hasUnsavedChanges: newUpdatedFields.length > 0 || state.currentEntryName !== state.originalEntryName,
              errors: newErrors,
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

        // Otherwise, get value from original fields
        const originalField = state.originalFields.find((f) => f.id === fieldId);
        return originalField?.content;
      },

      // Get field component
      getFieldComponent: (field: any) => {
        const fieldType = FIELD_TYPES.find((type) => type.value === field.type);
        return fieldType?.cmsComponent || null;
      },

      // Set field error
      setFieldError: (fieldId: string, error: string) => {
        set(
          (state) => ({
            errors: { ...state.errors, [fieldId]: error },
          }),
          false,
          "setFieldError"
        );
      },

      // Clear field error
      clearFieldError: (fieldId: string) => {
        set(
          (state) => {
            const newErrors = { ...state.errors };
            delete newErrors[fieldId];
            return { errors: newErrors };
          },
          false,
          "clearFieldError"
        );
      },

      // Validate all fields
      validateFields: (allFields: any[]) => {
        const state = get();
        const newErrors: Record<string, string> = {};

        allFields.forEach((field: any) => {
          const value = state.getFieldValue(field.id);
          if (field.required && !value) {
            newErrors[field.id] = "This field is required";
          }
        });

        set({ errors: newErrors }, false, "validateFields");
        return Object.keys(newErrors).length === 0;
      },

      // Toggle section expanded state
      toggleSection: (sectionId: string) => {
        set(
          (state) => ({
            expandedSections: {
              ...state.expandedSections,
              [sectionId]: !state.expandedSections[sectionId],
            },
          }),
          false,
          "toggleSection"
        );
      },

      // Reset a single field to its original value
      resetField: (fieldId: string) => {
        set(
          (state) => {
            const newUpdatedFields = state.updatedFields.filter((f) => f.id !== fieldId);

            return {
              updatedFields: newUpdatedFields,
              hasUnsavedChanges: newUpdatedFields.length > 0 || state.currentEntryName !== state.originalEntryName,
            };
          },
          false,
          "resetField"
        );
      },

      // Reset all fields to original values
      resetAllFields: () => {
        set(
          (state) => ({
            currentEntryName: state.originalEntryName,
            updatedFields: [],
            hasUnsavedChanges: false,
            errors: {},
          }),
          false,
          "resetAllFields"
        );
        toast.success("All changes reset");
      },

      // Save content to the server
      saveContent: async (entryId: string) => {
        const state = get();

        if (!state.hasUnsavedChanges) {
          toast.info("No changes to save");
          return;
        }

        // Validate before saving
        const allFields = state.originalFields.filter((f) => f.required);
        if (!state.validateFields(allFields)) {
          toast.error("Please fill in all required fields");
          return;
        }

        set({ isSaving: true }, false, "savingContent");

        try {
          // Update entry name if changed
          if (state.currentEntryName !== state.originalEntryName) {
            const nameResult = await updateCollectionEntry(entryId, { name: state.currentEntryName });
            if (!nameResult.success) {
              toast.error(nameResult.error || "Failed to update entry name");
              set({ isSaving: false }, false, "saveContentError");
              return;
            }
          }

          // Save field content if there are changes
          if (state.updatedFields.length > 0) {
            const result = await saveCollectionEntryContent(entryId, state.updatedFields);

            if (!result.success) {
              toast.error(result.error || "Failed to save entry");
              set({ isSaving: false }, false, "saveContentError");
              return;
            }
          }

          // After successful save, update original values and clear changes
          set(
            (state) => {
              const newOriginalFields = state.originalFields.map((field) => {
                const updatedField = state.updatedFields.find((f) => f.id === field.id);
                if (updatedField) {
                  return { ...field, content: updatedField.content };
                }
                return field;
              });

              return {
                originalEntryName: state.currentEntryName,
                originalFields: newOriginalFields,
                updatedFields: [],
                hasUnsavedChanges: false,
                isSaving: false,
              };
            },
            false,
            "saveContentSuccess"
          );

          toast.success("Entry saved successfully");
        } catch (error) {
          console.error("Error saving entry:", error);
          toast.error(error instanceof Error ? error.message : "Failed to save entry");
          set({ isSaving: false }, false, "saveContentError");
        }
      },
    }),
    {
      name: "collection-entry-editor-store",
      enabled: process.env.NODE_ENV === "development",
      trace: true,
      anonymousActionType: "collection-entry-editor-action",
    }
  )
);

