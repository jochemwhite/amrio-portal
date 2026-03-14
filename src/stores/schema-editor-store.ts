"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/helpers";
import {
  SupabaseSchemaWithRelations,
  SchemaSection,
  SchemaField,
} from "@/types/cms";
import {
  updateSchema,
  bulkSaveSchemaChanges,
} from "@/actions/cms/schema-actions";

interface PendingChange {
  type: "create" | "update" | "delete" | "reorder";
  entity: "section" | "field" | "sections" | "fields";
  id?: string;
  data?: any;
  tempId?: string;
}

interface SchemaBuilderState {
  schema: SupabaseSchemaWithRelations | null;
  sections: SchemaSection[];

  selectedSectionId: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  isAddSectionOpen: boolean;
  isEditSectionOpen: boolean;
  editingSectionId: string | null;
  sectionFormData: {
    name: string;
    description: string;
  };

  isAddFieldOpen: boolean;
  isEditFieldOpen: boolean;
  editingFieldId: string | null;
  parentFieldId: string | null;
  fieldFormData: {
    name: string;
    field_key: string;
    type: string;
    required: boolean;
    default_value: string;
    validation: string;
    settings: Record<string, any> | null;
    collection_id: string | null;
  };

  isSchemaSettingsOpen: boolean;
  schemaSettingsData: {
    name: string;
    description: string;
    template: boolean;
  };

  isUnsavedChangesDialogOpen: boolean;
  pendingNavigation: (() => void) | null;

  pendingChanges: PendingChange[];
  tempIdCounter: number;

  initializeStore: (schema: SupabaseSchemaWithRelations) => void;
  setSelectedSection: (sectionId: string | null) => void;

  openAddSectionDialog: () => void;
  openEditSectionDialog: (section: SchemaSection) => void;
  closeSectionDialog: () => void;
  setSectionFormData: (
    data: Partial<SchemaBuilderState["sectionFormData"]>,
  ) => void;
  submitSection: () => void;
  deleteSectionById: (sectionId: string) => void;

  openAddFieldDialog: (sectionId?: string) => void;
  openEditFieldDialog: (field: SchemaField) => void;
  closeFieldDialog: () => void;
  setFieldFormData: (
    data: Partial<SchemaBuilderState["fieldFormData"]>,
  ) => void;
  submitField: () => void;
  getFieldById: (fieldId: string) => SchemaField | null;
  deleteFieldById: (
    fieldId: string,
    sectionId: string,
    parentSectionId?: string,
  ) => void;

  openAddNestedFieldDialog: (
    parentSectionId: string,
    parentFieldId?: string,
  ) => void;
  openEditNestedFieldDialog: (field: any, parentSectionId: string) => void;
  deleteNestedFieldById: (fieldId: string, parentSectionId: string) => void;

  reorderSectionsByIndex: (fromIndex: number, toIndex: number) => void;
  moveFieldPreview: (args: {
    fieldId: string;
    fromSectionId: string;
    toSectionId: string;
    fromIndex: number;
    toIndex: number;
  }) => void;
  finalizeFieldDrag: (args: {
    fieldId: string;
    fromSectionId: string;
    toSectionId: string;
    fromIndex: number;
    toIndex: number;
  }) => void;
  reorderNestedFields: (
    sectionId: string,
    activeId: string,
    overId: string,
  ) => void;

  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  openSchemaSettings: () => void;
  closeSchemaSettings: () => void;
  setSchemaSettingsData: (
    data: Partial<{ name: string; description: string; template: boolean }>,
  ) => void;
  submitSchemaSettings: () => Promise<void>;

  checkUnsavedChanges: (navigationCallback: () => void) => boolean;
  confirmUnsavedChangesDialog: () => void;
  cancelUnsavedChangesDialog: () => void;
  discardChangesAndNavigate: () => void;
}

export const useSchemaBuilderStore = create<SchemaBuilderState>()(
  devtools(
    (set, get) => ({
      schema: null,
      sections: [],
      selectedSectionId: null,
      hasUnsavedChanges: false,
      isSaving: false,

      isAddSectionOpen: false,
      isEditSectionOpen: false,
      editingSectionId: null,
      sectionFormData: {
        name: "",
        description: "",
      },

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
        settings: null,
        collection_id: null,
      },

      isSchemaSettingsOpen: false,
      schemaSettingsData: {
        name: "",
        description: "",
        template: false,
      },

      isUnsavedChangesDialogOpen: false,
      pendingNavigation: null,

      pendingChanges: [],
      tempIdCounter: 1,

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
          "initializeStore",
        );
      },

      setSelectedSection: (sectionId: string | null) => {
        set({ selectedSectionId: sectionId }, false, "setSelectedSection");
      },

      openAddSectionDialog: () => {
        set(
          {
            sectionFormData: { name: "", description: "" },
            isAddSectionOpen: true,
          },
          false,
          "openAddSectionDialog",
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
          "openEditSectionDialog",
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
          "closeSectionDialog",
        );
      },

      setSectionFormData: (data) => {
        set(
          (state) => ({
            sectionFormData: { ...state.sectionFormData, ...data },
          }),
          false,
          "setSectionFormData",
        );
      },

      submitSection: () => {
        const {
          sectionFormData,
          editingSectionId,
          schema,
          sections,
          tempIdCounter,
        } = get();

        if (!sectionFormData.name.trim()) {
          toast.error("Section name is required");
          return;
        }

        if (!schema) {
          toast.error("No schema loaded");
          return;
        }

        if (editingSectionId) {
          set(
            (state) => ({
              sections: state.sections.map((s: any) =>
                s.id === editingSectionId
                  ? {
                      ...s,
                      name: sectionFormData.name,
                      description: sectionFormData.description,
                    }
                  : s,
              ),
              pendingChanges: [
                ...state.pendingChanges.filter(
                  (c) => !(c.entity === "section" && c.id === editingSectionId),
                ),
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
            "updateSectionLocal",
          );
        } else {
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
                  tempId,
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
            "addSectionLocal",
          );
        }
      },

      deleteSectionById: (sectionId: string) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === sectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        if (sectionId.startsWith("temp_")) {
          set(
            (state) => {
              const filteredChanges = state.pendingChanges.filter(
                (c) => !(c.entity === "section" && c.tempId === sectionId),
              );

              return {
                sections: state.sections.filter((s) => s.id !== sectionId),
                pendingChanges: filteredChanges,
                selectedSectionId:
                  state.sections.find((s) => s.id !== sectionId)?.id || null,
                hasUnsavedChanges: filteredChanges.length > 0,
              };
            },
            false,
            "deleteTempSection",
          );
        } else {
          set(
            (state) => ({
              sections: state.sections.filter((s) => s.id !== sectionId),
              pendingChanges: [
                ...state.pendingChanges.filter(
                  (c) => !(c.entity === "section" && c.id === sectionId),
                ),
                {
                  type: "delete",
                  entity: "section",
                  id: sectionId,
                },
              ],
              selectedSectionId:
                state.sections.find((s) => s.id !== sectionId)?.id || null,
              hasUnsavedChanges: true,
            }),
            false,
            "deleteSectionLocal",
          );
        }

        toast.success("Section deleted (not saved yet)");
      },

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
              settings: null,
            },
            isAddFieldOpen: true,
            parentFieldId: null,
            selectedSectionId: targetSectionId,
          },
          false,
          "openAddFieldDialog",
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
              settings: field.settings || null,
              collection_id: field.collection_id || null,
            },
            editingFieldId: field.id,
            isEditFieldOpen: true,
          },
          false,
          "openEditFieldDialog",
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
          "closeFieldDialog",
        );
      },

      setFieldFormData: (data) => {
        set(
          (state) => ({
            fieldFormData: { ...state.fieldFormData, ...data },
          }),
          false,
          "setFieldFormData",
        );
      },

      getFieldById: (fieldId: string) => {
        const { sections } = get();
        for (const section of sections) {
          const field = section.cms_schema_fields?.find(
            (f) => f.id === fieldId,
          );
          if (field) return field;
        }
        return null;
      },

      submitField: () => {
        const {
          fieldFormData,
          editingFieldId,
          selectedSectionId,
          sections,
          tempIdCounter,
          parentFieldId,
        } = get();

        if (!fieldFormData.name.trim()) {
          toast.error("Field name is required");
          return;
        }

        if (!fieldFormData.type) {
          toast.error("Field type is required");
          return;
        }

        if (editingFieldId) {
          let targetSectionId: string | null = null;
          let existingField: any = null;

          for (const section of sections) {
            const field = section.cms_schema_fields?.find(
              (f) => f.id === editingFieldId,
            );
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
            settings: fieldFormData.settings,
            collection_id: fieldFormData.collection_id || null,
          };

          set(
            (state) => {
              const newSections = state.sections.map((section) => {
                if (section.id !== targetSectionId) return section;

                const newFields = (section.cms_schema_fields || []).map(
                  (field: any) => {
                    if (field.id !== editingFieldId) return field;

                    return {
                      id: field.id,
                      order: field.order,
                      schema_section_id: field.schema_section_id,
                      parent_field_id: field.parent_field_id,
                      created_at: field.created_at,
                      updated_at: field.updated_at,
                      name: updatedFieldData.name,
                      field_key: updatedFieldData.field_key,
                      type: updatedFieldData.type,
                      required: updatedFieldData.required,
                      default_value: updatedFieldData.default_value,
                      validation: updatedFieldData.validation,
                      settings: updatedFieldData.settings,
                      collection_id: updatedFieldData.collection_id,
                    };
                  },
                );

                return { ...section, cms_schema_fields: newFields };
              });

              return {
                sections: newSections,
                pendingChanges: [
                  ...state.pendingChanges.filter(
                    (c) => !(c.entity === "field" && c.id === editingFieldId),
                  ),
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
            "updateFieldLocal",
          );
        } else {
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
            settings: fieldFormData.settings,
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
                      cms_schema_fields: [
                        ...(s.cms_schema_fields || []),
                        newField,
                      ],
                    }
                  : s,
              ),
              pendingChanges: [
                ...state.pendingChanges,
                {
                  type: "create",
                  entity: "field",
                  tempId,
                  data: {
                    schema_section_id: selectedSectionId,
                    name: fieldFormData.name,
                    field_key: fieldFormData.field_key,
                    type: fieldFormData.type,
                    required: fieldFormData.required,
                    default_value: fieldFormData.default_value,
                    validation: fieldFormData.validation,
                    settings: fieldFormData.settings,
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
            "addFieldLocal",
          );
        }
      },

      deleteFieldById: (fieldId, sectionId) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === sectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        const field = section.cms_schema_fields?.find((f) => f.id === fieldId);
        if (!field) {
          toast.error("Field not found");
          return;
        }

        if (fieldId.startsWith("temp_")) {
          set(
            (state) => {
              const filteredChanges = state.pendingChanges.filter(
                (c) => !(c.entity === "field" && c.tempId === fieldId),
              );
              return {
                sections: state.sections.map((s) =>
                  s.id === sectionId
                    ? {
                        ...s,
                        cms_schema_fields: s.cms_schema_fields?.filter(
                          (f: any) => f.id !== fieldId,
                        ),
                      }
                    : s,
                ),
                pendingChanges: filteredChanges,
                hasUnsavedChanges: filteredChanges.length > 0,
              };
            },
            false,
            "deleteTempField",
          );
        } else {
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter(
                        (f: any) => f.id !== fieldId,
                      ),
                    }
                  : s,
              ),
              pendingChanges: [
                ...state.pendingChanges.filter(
                  (c) => !(c.entity === "field" && c.id === fieldId),
                ),
                {
                  type: "delete",
                  entity: "field",
                  id: fieldId,
                },
              ],
              hasUnsavedChanges: true,
            }),
            false,
            "deleteFieldLocal",
          );
        }

        toast.success("Field deleted (not saved yet)");
      },

      openAddNestedFieldDialog: (
        parentSectionId: string,
        parentFieldId?: string,
      ) => {
        set(
          {
            fieldFormData: {
              name: "",
              field_key: "",
              type: "",
              required: false,
              default_value: "",
              validation: "",
              settings: null,
              collection_id: null,
            },
            isAddFieldOpen: true,
            parentFieldId: parentFieldId || null,
            selectedSectionId: parentSectionId,
          },
          false,
          "openAddNestedFieldDialog",
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
              settings: field.settings || null,
              collection_id: field.collection_id || null,
            },
            editingFieldId: field.id,
            isEditFieldOpen: true,
            selectedSectionId: parentSectionId,
          },
          false,
          "openEditNestedFieldDialog",
        );
      },

      deleteNestedFieldById: (fieldId: string, parentSectionId: string) => {
        const { sections } = get();
        const section = sections.find((s) => s.id === parentSectionId);

        if (!section) {
          toast.error("Section not found");
          return;
        }

        const field = section.cms_schema_fields?.find(
          (f: any) => f.id === fieldId,
        );
        if (!field) {
          toast.error("Field not found");
          return;
        }

        if (fieldId.startsWith("temp_")) {
          set(
            (state) => {
              const filteredChanges = state.pendingChanges.filter(
                (c) => !(c.entity === "field" && c.tempId === fieldId),
              );
              return {
                sections: state.sections.map((s) =>
                  s.id === parentSectionId
                    ? {
                        ...s,
                        cms_schema_fields: s.cms_schema_fields?.filter(
                          (f: any) => f.id !== fieldId,
                        ),
                      }
                    : s,
                ),
                pendingChanges: filteredChanges,
                hasUnsavedChanges: filteredChanges.length > 0,
              };
            },
            false,
            "deleteNestedTempField",
          );
        } else {
          set(
            (state) => ({
              sections: state.sections.map((s) =>
                s.id === parentSectionId
                  ? {
                      ...s,
                      cms_schema_fields: s.cms_schema_fields?.filter(
                        (f: any) => f.id !== fieldId,
                      ),
                    }
                  : s,
              ),
              pendingChanges: [
                ...state.pendingChanges.filter(
                  (c) => !(c.entity === "field" && c.id === fieldId),
                ),
                {
                  type: "delete",
                  entity: "field",
                  id: fieldId,
                },
              ],
              hasUnsavedChanges: true,
            }),
            false,
            "deleteNestedFieldLocal",
          );
        }

        toast.success("Nested field deleted (not saved yet)");
      },

      reorderSectionsByIndex: (fromIndex, toIndex) => {
        const { sections } = get();

        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || toIndex < 0) return;
        if (fromIndex >= sections.length || toIndex >= sections.length) return;

        const newSections = arrayMove(sections, fromIndex, toIndex).map(
          (section, index) => ({
            ...section,
            order: index,
          }),
        );

        set(
          (state) => ({
            sections: newSections,
            pendingChanges: [
              ...state.pendingChanges.filter(
                (c) => !(c.type === "reorder" && c.entity === "sections"),
              ),
              {
                type: "reorder",
                entity: "sections",
                data: { sectionOrder: newSections.map((s) => s.id) },
              },
            ],
            hasUnsavedChanges: true,
          }),
          false,
          "reorderSectionsByIndex",
        );
      },

      moveFieldPreview: ({
        fieldId,
        fromSectionId,
        toSectionId,
        fromIndex,
        toIndex,
      }) => {
        const { sections } = get();

        if (fromIndex < 0 || toIndex < 0) return;

        const sourceSection = sections.find((s) => s.id === fromSectionId);
        const targetSection = sections.find((s) => s.id === toSectionId);

        if (!sourceSection || !targetSection) return;

        const sourceFields = [...(sourceSection.cms_schema_fields ?? [])];
        const sameSection = fromSectionId === toSectionId;
        const targetFields = sameSection
          ? sourceFields
          : [...(targetSection.cms_schema_fields ?? [])];

        let realFromIndex = fromIndex;

        if (
          realFromIndex < 0 ||
          realFromIndex >= sourceFields.length ||
          sourceFields[realFromIndex]?.id !== fieldId
        ) {
          realFromIndex = sourceFields.findIndex((f: any) => f.id === fieldId);
        }

        if (realFromIndex === -1) return;

        const movingField = sourceFields[realFromIndex];
        if (!movingField) return;

        if (sameSection) {
          const safeToIndex = Math.max(
            0,
            Math.min(toIndex, sourceFields.length - 1),
          );

          const reordered = arrayMove(
            sourceFields,
            realFromIndex,
            safeToIndex,
          ).map((field: any, index: number) => ({
            ...field,
            order: index,
          }));

          set(
            (state) => ({
              sections: state.sections.map((section) =>
                section.id === fromSectionId
                  ? { ...section, cms_schema_fields: reordered }
                  : section,
              ),
            }),
            false,
            "moveFieldPreviewSameSection",
          );

          return;
        }

        sourceFields.splice(realFromIndex, 1);

        const movedField = {
          ...movingField,
          schema_section_id: toSectionId,
        };

        const safeToIndex = Math.max(0, Math.min(toIndex, targetFields.length));
        targetFields.splice(safeToIndex, 0, movedField);

        const normalizedSourceFields = sourceFields.map(
          (field: any, index: number) => ({
            ...field,
            order: index,
          }),
        );

        const normalizedTargetFields = targetFields.map(
          (field: any, index: number) => ({
            ...field,
            order: index,
          }),
        );

        set(
          (state) => ({
            sections: state.sections.map((section) => {
              if (section.id === fromSectionId) {
                return {
                  ...section,
                  cms_schema_fields: normalizedSourceFields,
                };
              }

              if (section.id === toSectionId) {
                return {
                  ...section,
                  cms_schema_fields: normalizedTargetFields,
                };
              }

              return section;
            }),
          }),
          false,
          "moveFieldPreviewAcrossSections",
        );
      },

      finalizeFieldDrag: ({
        fieldId,
        fromSectionId,
        toSectionId,
        fromIndex,
        toIndex,
      }) => {
        const { sections, pendingChanges } = get();

        if (fromIndex < 0 || toIndex < 0) return;

        const sourceSection = sections.find((s) => s.id === fromSectionId);
        const targetSection = sections.find((s) => s.id === toSectionId);

        if (!sourceSection || !targetSection) return;

        const sourceFields = [...(sourceSection.cms_schema_fields ?? [])];
        const sameSection = fromSectionId === toSectionId;
        const targetFields = sameSection
          ? sourceFields
          : [...(targetSection.cms_schema_fields ?? [])];

        const fieldExistsInSource = sourceFields.some((f: any) => f.id === fieldId);
        const fieldExistsInTarget = targetFields.some((f: any) => f.id === fieldId);

        if (!fieldExistsInSource && !fieldExistsInTarget) return;

        const filteredChanges = pendingChanges.filter(
          (c) =>
            !(
              c.type === "reorder" &&
              c.entity === "fields" &&
              (c.id === fromSectionId || c.id === toSectionId)
            ),
        );

        const nextChanges: PendingChange[] = [
          ...filteredChanges,
          {
            type: "reorder",
            entity: "fields",
            id: fromSectionId,
            data: {
              fieldOrder: sourceFields.map((f: any) => f.id),
            },
          },
        ];

        if (fromSectionId !== toSectionId) {
          nextChanges.push({
            type: "reorder",
            entity: "fields",
            id: toSectionId,
            data: {
              fieldOrder: targetFields.map((f: any) => f.id),
            },
          });
        }

        set(
          {
            pendingChanges: nextChanges,
            hasUnsavedChanges: true,
          },
          false,
          "finalizeFieldDrag",
        );
      },

      reorderNestedFields: () => {},

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
          const sectionOrder = sections.map((s) => s.id);

          const fieldOrders: Record<string, string[]> = {};
          sections.forEach((section) => {
            if (
              section.cms_schema_fields &&
              section.cms_schema_fields.length > 0
            ) {
              fieldOrders[section.id] = section.cms_schema_fields.map(
                (f: any) => f.id,
              );
            }
          });

          const result = await bulkSaveSchemaChanges({
            schemaId: schema.id,
            changes: pendingChanges,
            sectionOrder,
            fieldOrders,
          });

          if (result.success) {
            set(
              (state) => {
                const updatedSections = state.sections.map((section) => {
                  const realSectionId = section.id.startsWith("temp_")
                    ? result.tempIdMap[section.id]
                    : section.id;

                  return {
                    ...section,
                    id: realSectionId,
                    cms_schema_fields: section.cms_schema_fields?.map(
                      (field: any) => {
                        const realFieldId = field.id.startsWith("temp_")
                          ? result.tempIdMap[field.id]
                          : field.id;

                        return {
                          ...field,
                          id: realFieldId,
                          schema_section_id: realSectionId,
                        };
                      },
                    ),
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
              "saveSuccess",
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
          "resetChanges",
        );

        toast.info("Changes discarded");
      },

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
          "openSchemaSettings",
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
          "setSchemaSettingsData",
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
                schema: state.schema
                  ? { ...state.schema, ...schemaSettingsData }
                  : null,
                isSchemaSettingsOpen: false,
                isSaving: false,
              }),
              false,
              "saveSchemaSettingsSuccess",
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

      checkUnsavedChanges: (navigationCallback: () => void) => {
        const { hasUnsavedChanges } = get();

        if (hasUnsavedChanges) {
          set(
            {
              isUnsavedChangesDialogOpen: true,
              pendingNavigation: navigationCallback,
            },
            false,
            "checkUnsavedChanges",
          );
          return true;
        }

        return false;
      },

      confirmUnsavedChangesDialog: () => {
        set(
          { isUnsavedChangesDialogOpen: false },
          false,
          "confirmUnsavedChangesDialog",
        );
      },

      cancelUnsavedChangesDialog: () => {
        set(
          {
            isUnsavedChangesDialogOpen: false,
            pendingNavigation: null,
          },
          false,
          "cancelUnsavedChangesDialog",
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
          "discardChangesAndNavigate",
        );

        if (pendingNavigation) {
          pendingNavigation();
        }
      },
    }),
    { name: "SchemaBuilder" },
  ),
);