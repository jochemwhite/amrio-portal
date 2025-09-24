import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { FIELD_TYPES } from "@/components/cms/shared/field-types";
import { SupabaseField } from "@/types/cms";
import { savePageContent, loadPageContent } from "@/lib/actions/content";

// Types for content values
interface ContentValue {
  fieldId: string;
  value: any;
  lastModified?: string;
}

interface ContentEditorState {
  // Core data
  pageId: string | null;
  contentValues: Record<string, any>; // fieldId -> value
  originalValues: Record<string, any>; // for tracking changes
  
  // UI state
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  initializeContent: (pageId: string, existingContent?: Record<string, any>) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  getFieldComponent: (field: SupabaseField) => React.ComponentType<any> | null;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  saveContent: () => Promise<void>;
  loadContent: () => Promise<void>;
  
  // Validation
  validateField: (fieldId: string, fieldConfig: any) => string | null;
  validateAllFields: (schema: any[]) => Record<string, string>;
}

// Helper function to check if richtext content is empty
const isRichTextEmpty = (value: any): boolean => {
  if (!value || typeof value !== 'object') return true;
  if (!value.content || !Array.isArray(value.content)) return true;
  return value.content.length === 0 || 
         (value.content.length === 1 && 
          value.content[0].type === 'paragraph' && 
          (!value.content[0].content || value.content[0].content.length === 0));
};

export const useContentEditorStore = create<ContentEditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      pageId: null,
      contentValues: {},
      originalValues: {},
      hasUnsavedChanges: false,
      isSaving: false,
      isLoading: false,

      // Initialize store with page data
      initializeContent: (pageId: string, existingContent = {}) => {
        set(
          {
            pageId,
            contentValues: { ...existingContent },
            originalValues: { ...existingContent },
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
            const newValues = {
              ...state.contentValues,
              [fieldId]: value,
            };

            // Check if this creates unsaved changes
            const hasChanges = Object.keys(newValues).some(
              key => newValues[key] !== state.originalValues[key]
            ) || Object.keys(state.originalValues).some(
              key => !(key in newValues)
            );

            return {
              contentValues: newValues,
              hasUnsavedChanges: hasChanges,
            };
          },
          false,
          "setFieldValue"
        );
      },

      // Get a field value
      getFieldValue: (fieldId: string) => {
        return get().contentValues[fieldId];
      },

      // Get a field component
      getFieldComponent: (field: SupabaseField) => {
        const fieldType = FIELD_TYPES.find((type) => type.value === field.type);
        return fieldType?.cmsComponent || null;
      },

      // Reset a single field to its original value
      resetField: (fieldId: string) => {
        set(
          (state) => {
            const newValues = { ...state.contentValues };
            
            if (fieldId in state.originalValues) {
              newValues[fieldId] = state.originalValues[fieldId];
            } else {
              delete newValues[fieldId];
            }

            // Check if we still have unsaved changes
            const hasChanges = Object.keys(newValues).some(
              key => newValues[key] !== state.originalValues[key]
            ) || Object.keys(state.originalValues).some(
              key => !(key in newValues)
            );

            return {
              contentValues: newValues,
              hasUnsavedChanges: hasChanges,
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
            contentValues: { ...state.originalValues },
            hasUnsavedChanges: false,
          }),
          false,
          "resetAllFields"
        );
        toast.success("All changes reset");
      },

      // Save content values to the server
      saveContent: async () => {
        const { pageId, contentValues } = get();
        
        if (!pageId) {
          toast.error("No page selected");
          return;
        }

        set({ isSaving: true }, false, "savingContent");

        try {
          await savePageContent(pageId, contentValues);
          
          set(
            (state) => ({
              originalValues: { ...state.contentValues },
              hasUnsavedChanges: false,
              isSaving: false,
            }),
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

      // Load content values from the server
      loadContent: async () => {
        const { pageId } = get();
        
        if (!pageId) return;

        set({ isLoading: true }, false, "loadingContent");

        try {
          const result = await loadPageContent(pageId);
          
          set(
            {
              contentValues: { ...result.contentValues },
              originalValues: { ...result.contentValues },
              hasUnsavedChanges: false,
              isLoading: false,
            },
            false,
            "loadContentSuccess"
          );
        } catch (error) {
          console.error("Error loading content:", error);
          toast.error("Failed to load content");
          set({ isLoading: false }, false, "loadContentError");
        }
      },

      // Validate a single field
      validateField: (fieldId: string, fieldConfig: any) => {
        const value = get().contentValues[fieldId];
        
        // Required validation
        if (fieldConfig.required) {
          if (fieldConfig.type === 'richtext') {
            if (isRichTextEmpty(value)) {
              return 'This field is required';
            }
          } else if (value === undefined || value === null || value === '') {
            return 'This field is required';
          }
        }

        // Type-specific validation
        switch (fieldConfig.type) {
          case 'richtext':
            // Rich text is stored as JSON, so no additional validation needed
            // unless you want to check for specific content requirements
            break;
          case 'number':
            if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
              return 'Must be a valid number';
            }
            break;
          case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'Must be a valid email address';
            }
            break;
          case 'url':
            if (value && !/^https?:\/\/.+/.test(value)) {
              return 'Must be a valid URL';
            }
            break;
        }

        // Custom validation regex
        if (fieldConfig.validation && value) {
          try {
            const regex = new RegExp(fieldConfig.validation);
            if (!regex.test(value)) {
              return 'Value does not match required format';
            }
          } catch (e) {
            console.warn('Invalid validation regex:', fieldConfig.validation);
          }
        }

        return null;
      },

      // Validate all fields recursively
      validateAllFields: (schema: any[]) => {
        const errors: Record<string, string> = {};
        
        const validateFieldsRecursively = (fields: any[]) => {
          fields.forEach((field: any) => {
            const error = get().validateField(field.id, field);
            if (error) {
              errors[field.id] = error;
            }
            
            // If this field has nested fields (section type), validate them too
            if (field.fields && Array.isArray(field.fields)) {
              validateFieldsRecursively(field.fields);
            }
          });
        };
        
        schema.forEach(section => {
          // Handle both old structure (cms_fields) and new structure (fields)
          const fields = section.cms_fields || section.fields || [];
          validateFieldsRecursively(fields);
        });

        return errors;
      },
    }),
    {
      name: "content-editor-store",
    }
  )
); 