import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";
import { SupabaseSchemaWithRelations, SchemaSection, SchemaField } from "@/types/cms";
import { updateSchema, bulkSaveSchemaChanges } from "@/actions/cms/schema-actions";

// Types for tracking changes
interface PendingChange {
  type: "create" | "update" | "delete" | "reorder";
  entity: "section" | "field" | "sections" | "fields";
  id?: string;
  data?: any;
  tempId?: string; // For new items before they get real IDs
}

interface SchemaBuilderState {
  // Core data
  schema: SupabaseSchemaWithRelations | null;
  sections: SchemaSection[];

  // UI state
  selectedSectionId: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  // Section form state
  isAddSectionOpen: boolean;
  isEditSectionOpen: boolean;
  editingSectionId: string | null;
  sectionFormData: {
    name: string;
    description: string;
  };

  // Field form state
  isAddFieldOpen: boolean;
  isEditFieldOpen: boolean;
  editingFieldId: string | null;
  parentFieldId: string | null; // Track which "section" field we're adding to
  fieldFormData: {
    name: string;
    field_key: string;
    type: string;
    required: boolean;
    default_value: string;
    validation: string;
    collection_id: string | null;
  };

  // Schema settings state
  isSchemaSettingsOpen: boolean;
  schemaSettingsData: {
    name: string;
    description: string;
    template: boolean;
  };

  // Unsaved changes protection
  isUnsavedChangesDialogOpen: boolean;
  pendingNavigation: (() => void) | null;

  // Pending changes tracking
  pendingChanges: PendingChange[];
  tempIdCounter: number;

  // Actions
  initializeStore: (schema: SupabaseSchemaWithRelations) => void;
  setSelectedSection: (sectionId: string | null) => void;

  // Section actions
  openAddSectionDialog: () => void;
  openEditSectionDialog: (section: SchemaField) => void;
  closeSectionDialog: () => void;
  setSectionFormData: (data: Partial<SchemaBuilderState["sectionFormData"]>) => void;
  submitSection: () => void;
  deleteSectionById: (sectionId: string) => void;

  // Field actions
  openAddFieldDialog: (sectionId?: string) => void;
  openEditFieldDialog: (field: SchemaField) => void;
  closeFieldDialog: () => void;
  setFieldFormData: (data: Partial<SchemaBuilderState["fieldFormData"]>) => void;
  submitField: () => void;
  getFieldById: (fieldId: string) => SchemaField | null;
  deleteFieldById: (fieldId: string, sectionId: string, parentSectionId?: string) => void;

  // Nested field actions
  openAddNestedFieldDialog: (parentSectionId: string, parentFieldId?: string) => void;
  openEditNestedFieldDialog: (field: any, parentSectionId: string) => void;
  deleteNestedFieldById: (fieldId: string, parentSectionId: string) => void;

  // Reordering actions
  reorderSections: (activeId: string, overId: string) => void;
  reorderSectionFields: (sectionId: string, activeId: string, overId: string) => void;
  reorderNestedFields: (sectionId: string, activeId: string, overId: string) => void;

  // Save/Reset actions
  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  // Schema settings actions
  openSchemaSettings: () => void;
  closeSchemaSettings: () => void;
  setSchemaSettingsData: (data: Partial<{ name: string; description: string; template: boolean }>) => void;
  submitSchemaSettings: () => Promise<void>;

  // Unsaved changes protection
  checkUnsavedChanges: (navigationCallback: () => void) => boolean;
  confirmUnsavedChangesDialog: () => void;
  cancelUnsavedChangesDialog: () => void;
  discardChangesAndNavigate: () => void;
}

export const useSchemaBuilderStore = create<SchemaBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      schema: null,
      sections: [],
      selectedSectionId: null,
      hasUnsavedChanges: false,
      isSaving: false,

      // Section form state
      isAddSectionOpen: false,
      isEditSectionOpen: false,
      editingSectionId: null,
      sectionFormData: {
        name: "",
        description: "",
      },

      // Field form state
      isAddFieldOpen: false,
      isEditFieldOpen: false,
      editingFieldId: null,
      parentFieldId: null,
      fieldFormData: {
        name: "",
        field_key: "",
        type: "",
        required: false,
        default_value: "",
        validation: "",
        collection_id: null,
      },

      // Schema settings state
      isSchemaSettingsOpen: false,
      schemaSettingsData: {
        name: "",
        description: "",
        template: false,
      },

      // Unsaved changes protection
      isUnsavedChangesDialogOpen: false,
      pendingNavigation: null,

      // Pending changes
      pendingChanges: [],
      tempIdCounter: 1,

      // Initialize store with schema data
      initializeStore: (schema: SupabaseSchemaWithRelations) => {
        set(
          {
            schema,
            sections: (schema.cms_schema_sections || []) as any,
            selectedSectionId: schema.cms_schema_sections?.[0]?.id || null,
            hasUnsavedChanges: false,
            pendingChanges: [],
            tempIdCounter: 1,
            schemaSettingsData: {
              name: schema.name,
              description: schema.description || "",
              template: schema.template,
            },
          },
          false,
          "initializeStore"
        );
      },

      // Set selected section
      setSelectedSection: (sectionId: string | null) => {
        set({ selectedSectionId: sectionId }, false, "setSelectedSection");
      },

      // Section dialog actions
      openAddSectionDialog: () => {
        set(
          {
            sectionFormData: { name: "", description: "" },
            isAddSectionOpen: true,
          },
          false,
          "openAddSectionDialog"
        );
      },

      openEditSectionDialog: (section: any) => {
        set(
          {
            sectionFormData: {
              name: section.name,
              description: section.description || "",
            },
            editingSectionId: section.id,
            isEditSectionOpen: true,
          },
          false,
          "openEditSectionDialog"
        );
      },

      closeSectionDialog: () => {
        set(
          {
            isAddSectionOpen: false,
            isEditSectionOpen: false,
            editingSectionId: null,
          },
          false,
          "closeSectionDialog"
        );
      },

      setSectionFormData: (data) => {
        set(
          (state) => ({
            sectionFormData: { ...state.sectionFormData, ...data },
          }),
          false,
          "setSectionFormData"
        );
      },

      // Submit section (create or update) - LOCAL ONLY
      submitSection: () => {
        const { sectionFormData, editingSectionId, schema, sections, pendingChanges, tempIdCounter } = get();

        if (!sectionFormData.name.trim()) {
          toast.error("Section name is required");
          return;
        }

        if (!schema) {
          toast.error("No schema loaded");
          return;
        }

        if (editingSectionId) {
          // Update existing section locally
          set(
            (state) => ({
              sections: state.sections.map((s: any) =>
                s.id === editingSectionId ? { ...s, name: sectionFormData.name, description: sectionFormData.description } : s
              ),
              pendingChanges: [
                ...state.pendingChanges.filter((c) => !(c.entity === "section" && c.id === editingSectionId)),
                {
                  type: "update",
                  entity: "section",
                  id: editingSectionId,
                  data: {
                    name: sectionFormData.name,
                    description: sectionFormData.description,
                  },
                },
              ],
              isEditSectionOpen: false,
              hasUnsavedChanges: true,
            }),
            false,
            "updateSectionLocal"
          );
        } else {
          // Create new section locally
          const tempId = `temp_section_${tempIdCounter}`;
          const nextOrder = sections.length;
          const newSection = {
            id: tempId,
            name: sectionFormData.name,
            description: sectionFormData.description,
            cms_schema_fields: [],
            schema_id: schema.id,
            order: nextOrder,
          };

          set(
            (state) => ({
              sections: [...state.sections, newSection],
              selectedSectionId: tempId,
              pendingChanges: [
                ...state.pendingChanges,
                {
                  type: "create",
                  entity: "section",
                  tempId: tempId,
                  data: {
                    name: sectionFormData.name,
                    description: sectionFormData.description,
                  },
                },
              ],
              isAddSectionOpen: false,
              tempIdCounter: state.tempIdCounter + 1,
              hasUnsavedChanges: true,
            }),
            false,
            "addSectionLocal"
          );
        }
      },

      // Delete section (mark for deletion) - LOCAL ONLY
      deleteSectionById: (sectionId: string) => {
        const { sections, pendingChanges } = get();
        const section = sections.find((s) => s.id === sectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        if (sectionId.startsWith("temp_")) {
          // Remove temp section and its create change
          set(
            (state) => ({
              sections: state.sections.filter((s) => s.id !== sectionId),
              pendingChanges: state.pendingChanges.filter((c) => !(c.entity === "section" && c.tempId === sectionId)),
              selectedSectionId: state.sections[0]?.id || null,
              hasUnsavedChanges: state.pendingChanges.length > 1,
            }),
            false,
            "deleteTempSection"
          );
        } else {
          // Mark existing section for deletion
          set(
            (state) => ({
              sections: state.sections.filter((s) => s.id !== sectionId),
              pendingChanges: [
                ...state.pendingChanges.filter((c) => !(c.entity === "section" && c.id === sectionId)),
                {
                  type: "delete",
                  entity: "section",
                  id: sectionId,
                },
              ],
              selectedSectionId: state.sections[0]?.id || null,
              hasUnsavedChanges: true,
            }),
            false,
            "deleteSectionLocal"
          );
        }

        toast.success("Section deleted (not saved yet)");
      },

      // Field dialog actions
      openAddFieldDialog: (sectionId?: string) => {
        const { selectedSectionId } = get();
        const targetSectionId = sectionId || selectedSectionId;

        if (!targetSectionId) {
          toast.error("Please select a section first");
          return;
        }

        set(
          {
            fieldFormData: {
              name: "",
              field_key: "",
              type: "",
              required: false,
              default_value: "",
              validation: "",
              collection_id: null,
            },
            isAddFieldOpen: true,
            parentFieldId: null,
            selectedSectionId: targetSectionId, // Update the selected section
          },
          false,
          "openAddFieldDialog"
        );
      },

      openEditFieldDialog: (field: any) => {
        set(
          {
            fieldFormData: {
              name: field.name,
              field_key: field.field_key || "",
              type: field.type,
              required: field.required || false,
              default_value: field.default_value || "",
              validation: field.validation || "",
              collection_id: field.collection_id || null,
            },
            editingFieldId: field.id,
            isEditFieldOpen: true,
          },
          false,
          "openEditFieldDialog"
        );
      },

      closeFieldDialog: () => {
        set(
          {
            isAddFieldOpen: false,
            isEditFieldOpen: false,
            editingFieldId: null,
            parentFieldId: null,
          },
          false,
          "closeFieldDialog"
        );
      },

      setFieldFormData: (data) => {
        set(
          (state) => ({
            fieldFormData: { ...state.fieldFormData, ...data },
          }),
          false,
          "setFieldFormData"
        );
      },

      getFieldById: (fieldId: string) => {
        const { sections } = get();
        
        // Search through all sections to find the field
        for (const section of sections) {
          const field = section.cms_schema_fields?.find((f) => f.id === fieldId);
          if (field) {
            return field;
          }
        }

        // Field not found
        return null;
      },

      // Submit field (create or update) - LOCAL ONLY
      submitField: () => {
        const { fieldFormData, editingFieldId, selectedSectionId, sections, pendingChanges, tempIdCounter, parentFieldId } = get();

        if (!fieldFormData.name.trim()) {
          toast.error("Field name is required");
          return;
        }

        if (!fieldFormData.type) {
          toast.error("Field type is required");
          return;
        }

        if (editingFieldId) {
          // Update existing field - find which section it belongs to
          let targetSectionId: string | null = null;
          let existingField: any = null;

          // Search all sections to find the field
          for (const section of sections) {
            const field = section.cms_schema_fields?.find((f) => f.id === editingFieldId);
            if (field) {
              targetSectionId = section.id;
              existingField = field;
              break;
            }
          }

          if (!targetSectionId || !existingField) {
            toast.error("Field not found");
            return;
          }

          const updatedFieldData = {
            name: fieldFormData.name,
            field_key: fieldFormData.field_key,
            type: fieldFormData.type,
            required: fieldFormData.required,
            default_value: fieldFormData.default_value,
            validation: fieldFormData.validation,
            collection_id: fieldFormData.collection_id || null,
          };

          set(
            (state) => {
              // Create new sections array with updated field
              const newSections = state.sections.map((section) => {
                if (section.id !== targetSectionId) {
                  return section;
                }

                // Create new fields array with updated field
                const newFields = (section.cms_schema_fields || []).map((field: any) => {
                  if (field.id !== editingFieldId) {
                    return field;
                  }

                  // Create completely new field object
                  return {
                    id: field.id,
                    order: field.order,
                    schema_section_id: field.schema_section_id,
                    parent_field_id: field.parent_field_id,
                    created_at: field.created_at,
                    updated_at: field.updated_at,
                    // Updated properties
                    name: updatedFieldData.name,
                    field_key: updatedFieldData.field_key,
                    type: updatedFieldData.type,
                    required: updatedFieldData.required,
                    default_value: updatedFieldData.default_value,
                    validation: updatedFieldData.validation,
                    collection_id: updatedFieldData.collection_id,
                  };
                });

                // Return new section object with new fields array
                return {
                  ...section,
                  cms_schema_fields: newFields,
                };
              });

              return {
                sections: newSections,
                pendingChanges: [
                  ...state.pendingChanges.filter((c) => !(c.entity === "field" && c.id === editingFieldId)),
                  {
                    type: "update",
                    entity: "field",
                    id: editingFieldId,
                    data: updatedFieldData,
                  },
                ],
                isEditFieldOpen: false,
                hasUnsavedChanges: true,
              };
            },
            false,
            "updateFieldLocal"
          );
        } else {
          // Create new field locally
          if (!selectedSectionId) {
            toast.error("No section selected");
            return;
          }

          const section = sections.find((s) => s.id === selectedSectionId);
          if (!section) {
            toast.error("Section not found");
            return;
          }

          const tempId = `temp_field_${tempIdCounter}`;
          const nextOrder = section.cms_schema_fields?.length || 0;
          const newField = {
            id: tempId,
            name: fieldFormData.name,
            field_key: fieldFormData.field_key,
            type: fieldFormData.type,
            required: fieldFormData.required,
            default_value: fieldFormData.default_value,
            validation: fieldFormData.validation,
            order: nextOrder,
            schema_section_id: selectedSectionId,
            parent_field_id: parentFieldId,
            collection_id: fieldFormData.collection_id || null,
          };

          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === selectedSectionId
                  ? {
                      ...s,
                      cms_schema_fields: [...(s.cms_schema_fields || []), newField],
                    }
                  : s
              ),
              pendingChanges: [
                ...state.pendingChanges,
                {
                  type: "create",
                  entity: "field",
                  tempId: tempId,
                  data: {
                    schema_section_id: selectedSectionId,
                    name: fieldFormData.name,
                    field_key: fieldFormData.field_key,
                    type: fieldFormData.type,
                    required: fieldFormData.required,
                    default_value: fieldFormData.default_value,
                    validation: fieldFormData.validation,
                    parent_field_id: parentFieldId,
                    collection_id: fieldFormData.collection_id || null,
                  },
                },
              ],
              isAddFieldOpen: false,
              tempIdCounter: state.tempIdCounter + 1,
              hasUnsavedChanges: true,
            }),
            false,
            "addFieldLocal"
          );
        }
      },

      // Delete field (mark for deletion) - LOCAL ONLY
      deleteFieldById: (fieldId, sectionId, parentSectionId) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === sectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        const field = section.cms_schema_fields?.find((f) => f.id === fieldId);
        if (!field) {
          console.error("Field not found", fieldId, section.cms_schema_fields);
          toast.error("Field not found");
          return;
        }

        if (fieldId.startsWith("temp_")) {
          // Remove temp field and its create change
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter((f: any) => f.id !== fieldId),
                    }
                  : s
              ),
              pendingChanges: state.pendingChanges.filter((c) => !(c.entity === "field" && c.tempId === fieldId)),
              hasUnsavedChanges: state.pendingChanges.length > 1,
            }),
            false,
            "deleteTempField"
          );
        } else {
          // Mark existing field for deletion
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter((f: any) => f.id !== fieldId),
                    }
                  : s
              ),
              pendingChanges: [
                ...state.pendingChanges.filter((c) => !(c.entity === "field" && c.id === fieldId)),
                {
                  type: "delete",
                  entity: "field",
                  id: fieldId,
                },
              ],
              hasUnsavedChanges: true,
            }),
            false,
            "deleteFieldLocal"
          );
        }

        toast.success("Field deleted (not saved yet)");
      },

      // Nested field actions (simplified - treating nested fields as regular fields with parent_field_id)
      openAddNestedFieldDialog: (parentSectionId: string, parentFieldId?: string) => {
        set(
          {
            fieldFormData: {
              name: "",
              field_key: "",
              type: "",
              required: false,
              default_value: "",
              validation: "",
              collection_id: null,
            },
            isAddFieldOpen: true,
            parentFieldId: parentFieldId || null,
            selectedSectionId: parentSectionId,
          },
          false,
          "openAddNestedFieldDialog"
        );
      },

      openEditNestedFieldDialog: (field: any, parentSectionId: string) => {
        set(
          {
            fieldFormData: {
              name: field.name,
              field_key: field.field_key || "",
              type: field.type,
              required: field.required || false,
              default_value: field.default_value || "",
              validation: field.validation || "",
              collection_id: field.collection_id || null,
            },
            editingFieldId: field.id,
            isEditFieldOpen: true,
            selectedSectionId: parentSectionId,
          },
          false,
          "openEditNestedFieldDialog"
        );
      },

      deleteNestedFieldById: (fieldId: string, parentSectionId: string) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === parentSectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        const field = section.cms_schema_fields?.find((f: any) => f.id === fieldId);
        if (!field) {
          toast.error("Field not found");
          return;
        }

        if (fieldId.startsWith("temp_")) {
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === parentSectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter((f: any) => f.id !== fieldId),
                    }
                  : s
              ),
              pendingChanges: state.pendingChanges.filter((c) => !(c.entity === "field" && c.tempId === fieldId)),
              hasUnsavedChanges: state.pendingChanges.length > 1,
            }),
            false,
            "deleteNestedTempField"
          );
        } else {
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === parentSectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter((f: any) => f.id !== fieldId),
                    }
                  : s
              ),
              pendingChanges: [
                ...state.pendingChanges.filter((c) => !(c.entity === "field" && c.id === fieldId)),
                {
                  type: "delete",
                  entity: "field",
                  id: fieldId,
                },
              ],
              hasUnsavedChanges: true,
            }),
            false,
            "deleteNestedFieldLocal"
          );
        }

        toast.success("Nested field deleted (not saved yet)");
      },

      // Reordering actions
      reorderSections: (activeId: string, overId: string) => {
        const { sections, pendingChanges } = get();
        const oldIndex = sections.findIndex((s) => s.id === activeId);
        const newIndex = sections.findIndex((s) => s.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newSections = arrayMove(sections, oldIndex, newIndex);

        set(
          (state) => ({
            sections: newSections,
            pendingChanges: [
              ...state.pendingChanges.filter((c) => !(c.type === "reorder" && c.entity === "sections")),
              {
                type: "reorder",
                entity: "sections",
                data: {
                  sectionOrder: newSections.map((s) => s.id),
                },
              },
            ],
            hasUnsavedChanges: true,
          }),
          false,
          "reorderSections"
        );
      },

      reorderSectionFields: (sectionId: string, activeId: string, overId: string) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === sectionId);

        if (!section || !section.cms_schema_fields) return;

        const fields = section.cms_schema_fields;
        const oldIndex = fields.findIndex((f: any) => f.id === activeId);
        const newIndex = fields.findIndex((f: any) => f.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newFields = arrayMove(fields, oldIndex, newIndex);

        set(
          (state) => ({
            sections: state.sections.map((s) => (s.id === sectionId ? { ...s, cms_schema_fields: newFields } : s)),
            pendingChanges: [
              ...state.pendingChanges.filter((c) => !(c.type === "reorder" && c.entity === "fields" && c.data?.sectionId === sectionId)),
              {
                type: "reorder",
                entity: "fields",
                data: {
                  sectionId,
                  fieldOrder: newFields.map((f: any) => f.id),
                },
              },
            ],
            hasUnsavedChanges: true,
          }),
          false,
          "reorderSectionFields"
        );
      },

      reorderNestedFields: (sectionId: string, activeId: string, overId: string) => {
        // For now, same as reorderSectionFields
        get().reorderSectionFields(sectionId, activeId, overId);
      },

      // Save changes to server
      saveChanges: async () => {
        const { schema, sections, pendingChanges, hasUnsavedChanges } = get();

        if (!schema) {
          toast.error("No schema loaded");
          return;
        }

        if (!hasUnsavedChanges) {
          toast.info("No changes to save");
          return;
        }

        set({ isSaving: true }, false, "startSaving");

        try {
          // Build section order array from current state
          const sectionOrder = sections.map((s) => s.id);

          // Build field orders map from current state
          const fieldOrders: Record<string, string[]> = {};
          sections.forEach((section) => {
            if (section.cms_schema_fields && section.cms_schema_fields.length > 0) {
              fieldOrders[section.id] = section.cms_schema_fields.map((f: any) => f.id);
            }
          });

          const result = await bulkSaveSchemaChanges({
            schemaId: schema.id,
            changes: pendingChanges,
            sectionOrder,
            fieldOrders,
          });

          if (result.success) {
            // Update local state with real IDs from server
            set(
              (state) => {
                const updatedSections = state.sections.map((section) => {
                  const realSectionId = section.id.startsWith("temp_") ? result.tempIdMap[section.id] : section.id;

                  return {
                    ...section,
                    id: realSectionId,
                    cms_schema_fields: section.cms_schema_fields?.map((field: any) => {
                      const realFieldId = field.id.startsWith("temp_") ? result.tempIdMap[field.id] : field.id;
                      return {
                        ...field,
                        id: realFieldId,
                        schema_section_id: realSectionId,
                      };
                    }),
                  };
                });

                return {
                  sections: updatedSections,
                  pendingChanges: [],
                  hasUnsavedChanges: false,
                  isSaving: false,
                };
              },
              false,
              "saveSuccess"
            );

            toast.success("Changes saved successfully!");
          } else {
            toast.error(result.error || "Failed to save changes");
            set({ isSaving: false }, false, "saveError");
          }
        } catch (error) {
          console.error("Error saving changes:", error);
          toast.error("An unexpected error occurred");
          set({ isSaving: false }, false, "saveException");
        }
      },

      // Reset changes
      resetChanges: () => {
        const { schema } = get();
        if (!schema) return;

        set(
          {
            sections: (schema.cms_schema_sections || []) as any,
            pendingChanges: [],
            hasUnsavedChanges: false,
            selectedSectionId: schema.cms_schema_sections?.[0]?.id || null,
          },
          false,
          "resetChanges"
        );

        toast.info("Changes discarded");
      },

      // Schema settings actions
      openSchemaSettings: () => {
        const { schema } = get();
        if (!schema) return;

        set(
          {
            schemaSettingsData: {
              name: schema.name,
              description: schema.description || "",
              template: schema.template,
            },
            isSchemaSettingsOpen: true,
          },
          false,
          "openSchemaSettings"
        );
      },

      closeSchemaSettings: () => {
        set({ isSchemaSettingsOpen: false }, false, "closeSchemaSettings");
      },

      setSchemaSettingsData: (data) => {
        set(
          (state) => ({
            schemaSettingsData: { ...state.schemaSettingsData, ...data },
          }),
          false,
          "setSchemaSettingsData"
        );
      },

      submitSchemaSettings: async () => {
        const { schema, schemaSettingsData } = get();
        if (!schema) return;

        set({ isSaving: true }, false, "startSavingSchemaSettings");

        try {
          const result = await updateSchema(schema.id, schemaSettingsData);

          if (result.success) {
            set(
              (state) => ({
                schema: state.schema ? { ...state.schema, ...schemaSettingsData } : null,
                isSchemaSettingsOpen: false,
                isSaving: false,
              }),
              false,
              "saveSchemaSettingsSuccess"
            );

            toast.success("Schema settings updated!");
          } else {
            toast.error(result.error || "Failed to update schema settings");
            set({ isSaving: false }, false, "saveSchemaSettingsError");
          }
        } catch (error) {
          console.error("Error updating schema settings:", error);
          toast.error("An unexpected error occurred");
          set({ isSaving: false }, false, "saveSchemaSettingsException");
        }
      },

      // Unsaved changes protection
      checkUnsavedChanges: (navigationCallback: () => void) => {
        const { hasUnsavedChanges } = get();

        if (hasUnsavedChanges) {
          set(
            {
              isUnsavedChangesDialogOpen: true,
              pendingNavigation: navigationCallback,
            },
            false,
            "checkUnsavedChanges"
          );
          return true; // Block navigation
        }

        return false; // Allow navigation
      },

      confirmUnsavedChangesDialog: () => {
        set({ isUnsavedChangesDialogOpen: true }, false, "confirmUnsavedChangesDialog");
      },

      cancelUnsavedChangesDialog: () => {
        set(
          {
            isUnsavedChangesDialogOpen: false,
            pendingNavigation: null,
          },
          false,
          "cancelUnsavedChangesDialog"
        );
      },

      discardChangesAndNavigate: () => {
        const { pendingNavigation } = get();

        set(
          {
            isUnsavedChangesDialogOpen: false,
            hasUnsavedChanges: false,
            pendingChanges: [],
          },
          false,
          "discardChangesAndNavigate"
        );

        if (pendingNavigation) {
          pendingNavigation();
        }
      },
    }),
    { name: "SchemaBuilder" }
  )
);
