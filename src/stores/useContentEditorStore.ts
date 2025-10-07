import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { FIELD_TYPES } from "@/components/cms/shared/field-types";
import { RPCPageResponse, RPCPageSection, RPCPageField, Section, Field, SupabaseField } from "@/types/cms";
import { savePageContent, loadPageContent } from "@/lib/actions/content";

// Helper function to convert RPCPageField to Field with content value
const convertRPCFieldToField = (rpcField: RPCPageField): Field & { value?: any; fields?: Field[] } => {
  const field: Field & { value?: any; fields?: Field[] } = {
    id: rpcField.id,
    name: rpcField.name,
    type: rpcField.type,
    required: rpcField.required,
    defaultValue: rpcField.default_value,
    validation: rpcField.validation,
    order: rpcField.order,
  };

  // Handle richtext fields specially - content is stored directly, not under .value
  if (rpcField.type === "richtext" && rpcField.content) {
    field.value = rpcField.content;
    field.content = rpcField.content;
  } else if (rpcField.content?.value !== undefined) {
    // Extract the value from content for other field types
    field.value = rpcField.content.value;
  }

  // Handle nested section fields
  if (rpcField.fields && rpcField.fields.length > 0) {
    field.fields = rpcField.fields.map(convertRPCFieldToField);
  }

  return field;
};

// Helper function to convert RPCPageSection to Section
const convertRPCSectionToSection = (rpcSection: RPCPageSection): Section => {
  return {
    id: rpcSection.id,
    name: rpcSection.name,
    description: rpcSection.description,
    order: rpcSection.order,
    fields: rpcSection.fields.map(convertRPCFieldToField),
  };
};

// Helper function to convert RPCPageResponse to Section[]
const convertRPCPageToSections = (rpcPage: RPCPageResponse): Section[] => {
  return rpcPage.sections.map(convertRPCSectionToSection);
};

interface ContentEditorState {
  // Core data
  pageId: string | null;
  websiteId: string | null;
  pageData: RPCPageResponse | null; // Full page structure from database
  contentValues: Section[]; // Section structure with field values
  originalValues: Section[]; // for tracking changes

  // UI state
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  initializeContent: (pageId: string, websiteId: string, existingContent?: RPCPageResponse | null) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  getFieldComponent: (field: SupabaseField) => React.ComponentType<any> | null;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  saveContent: () => Promise<void>;
  loadContent: () => Promise<void>;
}

export const useContentEditorStore = create<ContentEditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      pageId: null,
      websiteId: null,
      pageData: null,
      contentValues: [],
      originalValues: [],
      hasUnsavedChanges: false,
      isSaving: false,
      isLoading: false,

      // Initialize store with page data
      initializeContent: (pageId: string, websiteId: string, existingContent = null) => {
        const sections = existingContent ? convertRPCPageToSections(existingContent) : [];

        set(
          {
            pageId,
            websiteId,
            pageData: existingContent,
            contentValues: sections,
            originalValues: JSON.parse(JSON.stringify(sections)), // Deep clone
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
            // Deep clone the sections array
            const newSections = JSON.parse(JSON.stringify(state.contentValues)) as Section[];

            // Helper to recursively find and update field
            const updateFieldRecursively = (fields: (Field & { value?: any; fields?: any[] })[]): boolean => {
              for (const field of fields) {
                if (field.id === fieldId) {
                  field.value = value;
                  return true;
                }
                // Check nested fields (for section fields)
                if (field.fields && updateFieldRecursively(field.fields)) {
                  return true;
                }
              }
              return false;
            };

            // Find and update the field in sections
            for (const section of newSections) {
              if (updateFieldRecursively(section.fields)) {
                break;
              }
            }

            // Check if there are unsaved changes by comparing with original
            const hasChanges = JSON.stringify(newSections) !== JSON.stringify(state.originalValues);

            return {
              contentValues: newSections,
              hasUnsavedChanges: hasChanges,
            };
          },
          false,
          "setFieldValue"
        );
      },

      // Get a field value
      getFieldValue: (fieldId: string) => {
        const state = get();

        // Helper to recursively find field
        const findFieldRecursively = (fields: (Field & { value?: any; fields?: any[] })[]): any => {
          for (const field of fields) {
            if (field.id === fieldId) {
              return field.value;
            }
            // Check nested fields (for section fields)
            if (field.fields) {
              const found = findFieldRecursively(field.fields);
              if (found !== undefined) {
                return found;
              }
            }
          }
          return undefined;
        };

        // Search through all sections
        for (const section of state.contentValues) {
          const value = findFieldRecursively(section.fields);
          if (value !== undefined) {
            return value;
          }
        }

        return undefined;
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
            // Deep clone the sections array
            const newSections = JSON.parse(JSON.stringify(state.contentValues)) as Section[];

            // Helper to recursively find and get original value
            const getOriginalValueRecursively = (fields: (Field & { value?: any; fields?: any[] })[]): any => {
              for (const field of fields) {
                if (field.id === fieldId) {
                  return field.value;
                }
                if (field.fields) {
                  const found = getOriginalValueRecursively(field.fields);
                  if (found !== undefined) {
                    return found;
                  }
                }
              }
              return undefined;
            };

            // Get original value
            let originalValue: any = undefined;
            for (const section of state.originalValues) {
              originalValue = getOriginalValueRecursively(section.fields);
              if (originalValue !== undefined) {
                break;
              }
            }

            // Helper to recursively find and reset field
            const resetFieldRecursively = (fields: (Field & { value?: any; fields?: any[] })[]): boolean => {
              for (const field of fields) {
                if (field.id === fieldId) {
                  field.value = originalValue;
                  return true;
                }
                if (field.fields && resetFieldRecursively(field.fields)) {
                  return true;
                }
              }
              return false;
            };

            // Find and reset the field in sections
            for (const section of newSections) {
              if (resetFieldRecursively(section.fields)) {
                break;
              }
            }

            // Check if we still have unsaved changes
            const hasChanges = JSON.stringify(newSections) !== JSON.stringify(state.originalValues);

            return {
              contentValues: newSections,
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
            contentValues: JSON.parse(JSON.stringify(state.originalValues)),
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
          // Flatten all fields from all sections (including nested fields)
          const allFields: (Field & { value?: any; fields?: any[] })[] = [];

          contentValues.forEach((section) => {
            allFields.push(...section.fields);
          });

          await savePageContent(pageId, allFields);

          set(
            (state) => ({
              originalValues: JSON.parse(JSON.stringify(state.contentValues)),
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
        const { pageId, websiteId } = get();

        if (!pageId || !websiteId) return;

        set({ isLoading: true }, false, "loadingContent");

        try {
          const result = await loadPageContent(pageId, websiteId);

          // result should be RPCPageResponse
          const sections = convertRPCPageToSections(result);

          set(
            {
              pageData: result,
              contentValues: sections,
              originalValues: JSON.parse(JSON.stringify(sections)),
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

    

    }),
    {
      name: "content-editor-store",
    }
  )
);
