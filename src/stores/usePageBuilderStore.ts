import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import { bulkSavePageChanges } from "@/actions/cms/section-actions";
import { arrayMove } from "@dnd-kit/sortable";
import { SupabasePageWithRelations, SupabaseSectionWithRelations } from "@/types/cms";

// Types for tracking changes
interface PendingChange {
  type: 'create' | 'update' | 'delete';
  entity: 'section' | 'field';
  id?: string;
  data?: any;
  tempId?: string; // For new items before they get real IDs
}

interface PageBuilderState {
  // Core data
  page: SupabasePageWithRelations | null;
  sections: SupabaseSectionWithRelations[];
  websiteId: string;

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
  fieldFormData: {
    name: string;
    type: string;
    required: boolean;
    default_value: string;
    validation: string;
  };

  // Page settings state
  isPageSettingsOpen: boolean;
  pageSettingsData: {
    name: string;
    description: string;
    slug: string;
    status: string;
  };

  // Unsaved changes protection
  isUnsavedChangesDialogOpen: boolean;
  pendingNavigation: (() => void) | null;

  // Mode switching (schema builder vs content editor)
  mode: 'schema' | 'content';

  // Pending changes tracking
  pendingChanges: PendingChange[];
  tempIdCounter: number;

  // Actions
  initializeStore: (page: SupabasePageWithRelations, websiteId: string) => void;
  setSelectedSection: (sectionId: string | null) => void;

  // Section actions
  openAddSectionDialog: () => void;
  openEditSectionDialog: (section: any) => void;
  closeSectionDialog: () => void;
  setSectionFormData: (data: Partial<PageBuilderState["sectionFormData"]>) => void;
  submitSection: () => void;
  deleteSectionById: (sectionId: string) => void;

  // Field actions
  openAddFieldDialog: () => void;
  openEditFieldDialog: (field: any) => void;
  closeFieldDialog: () => void;
  setFieldFormData: (data: Partial<PageBuilderState["fieldFormData"]>) => void;
  submitField: () => void;
  deleteFieldById: (fieldId: string) => void;

  // Nested field actions
  openAddNestedFieldDialog: (parentSectionId: string) => void;
  openEditNestedFieldDialog: (field: any, parentSectionId: string) => void;
  deleteNestedFieldById: (fieldId: string, parentSectionId: string) => void;

  // Reordering actions
  reorderSections: (activeId: string, overId: string) => void;
  reorderSectionFields: (sectionId: string, activeId: string, overId: string) => void;

  // Save/Reset actions
  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  // Page settings actions
  openPageSettings: () => void;
  closePageSettings: () => void;
  setPageSettingsData: (data: Partial<{ name: string; description: string; slug: string; status: string }>) => void;
  submitPageSettings: () => Promise<void>;

  // Unsaved changes protection
  checkUnsavedChanges: (navigationCallback: () => void) => boolean;
  confirmUnsavedChangesDialog: () => void;
  cancelUnsavedChangesDialog: () => void;
  discardChangesAndNavigate: () => void;

  // Mode switching
  setMode: (mode: 'schema' | 'content') => void;
}

export const usePageBuilderStore = create<PageBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      page: null,
      sections: [],
      websiteId: "",
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
      fieldFormData: {
        name: "",
        type: "text",
        required: false,
        default_value: "",
        validation: "",
      },

      // Page settings state
      isPageSettingsOpen: false,
      pageSettingsData: {
        name: "",
        description: "",
        slug: "",
        status: "draft",
      },

      // Unsaved changes protection
      isUnsavedChangesDialogOpen: false,
      pendingNavigation: null,

      // Mode switching
      mode: 'schema',

      // Pending changes
      pendingChanges: [],
      tempIdCounter: 1,

      // Initialize store with page data
      initializeStore: (page: SupabasePageWithRelations, websiteId: string) => {
        set(
          {
            page,
            sections: (page.cms_sections || []) as any,
            websiteId,
            selectedSectionId: page.cms_sections?.[0]?.id || null,
            hasUnsavedChanges: false,
            pendingChanges: [],
            tempIdCounter: 1,
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
        const { sectionFormData, editingSectionId, page, sections, pendingChanges, tempIdCounter } = get();

        if (!sectionFormData.name.trim()) {
          toast.error("Section name is required");
          return;
        }

        if (!page) {
          toast.error("No page loaded");
          return;
        }

        if (editingSectionId) {
          // Update existing section locally
          set(
            (state) => ({
              sections: state.sections.map((s: any) =>
                s.id === editingSectionId 
                  ? { ...s, name: sectionFormData.name, description: sectionFormData.description } 
                  : s
              ),
              pendingChanges: [
                ...state.pendingChanges.filter(c => !(c.entity === 'section' && c.id === editingSectionId)),
                {
                  type: 'update',
                  entity: 'section',
                  id: editingSectionId,
                  data: {
                    name: sectionFormData.name,
                    description: sectionFormData.description,
                  }
                }
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
          const nextOrder = sections.length; // New sections go at the end
          const newSection = {
            id: tempId,
            name: sectionFormData.name,
            description: sectionFormData.description,
            cms_fields: [],
            page_id: page.id,
            order: nextOrder,
          };
          
          set(
            (state) => ({
              sections: [...state.sections, newSection],
              selectedSectionId: tempId,
              pendingChanges: [
                ...state.pendingChanges,
                {
                  type: 'create',
                  entity: 'section',
                  tempId: tempId,
                  data: {
                    page_id: page.id,
                    name: sectionFormData.name,
                    description: sectionFormData.description,
                    order: nextOrder,
                  }
                }
              ],
              tempIdCounter: state.tempIdCounter + 1,
              isAddSectionOpen: false,
              hasUnsavedChanges: true,
            }),
            false,
            "createSectionLocal"
          );
        }
      },

      // Delete section - LOCAL ONLY
      deleteSectionById: (sectionId: string) => {
        const { selectedSectionId, sections, pendingChanges } = get();
        
        set(
          (state) => {
            const isTemp = sectionId.startsWith('temp_');
            let newPendingChanges = state.pendingChanges;
            
            if (isTemp) {
              // Remove from pending changes if it's a temp item
              newPendingChanges = state.pendingChanges.filter(c => c.tempId !== sectionId);
            } else {
              // Add delete change for real sections, remove any existing changes for this section
              newPendingChanges = [
                ...state.pendingChanges.filter(c => !(c.entity === 'section' && c.id === sectionId)),
                {
                  type: 'delete',
                  entity: 'section',
                  id: sectionId,
                }
              ];
            }

            const remainingSections = state.sections.filter((s: any) => s.id !== sectionId);
            
            return {
              sections: remainingSections,
              selectedSectionId:
                selectedSectionId === sectionId
                  ? remainingSections[0]?.id || null
                  : selectedSectionId,
              pendingChanges: newPendingChanges,
              hasUnsavedChanges: newPendingChanges.length > 0,
            };
          },
          false,
          "deleteSectionLocal"
        );
      },

      // Field dialog actions
      openAddFieldDialog: () => {
        const { selectedSectionId } = get();
        if (!selectedSectionId) {
          toast.error("Please select a section first");
          return;
        }
        set(
          {
            fieldFormData: {
              name: "",
              type: "text",
              required: false,
              default_value: "",
              validation: "",
            },
            isAddFieldOpen: true,
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
              type: field.type,
              required: field.required || false,
              default_value: field.default_value || "",
              validation: field.validation || "",
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

      // Submit field (create or update) - LOCAL ONLY
      submitField: () => {
        const { fieldFormData, editingFieldId, selectedSectionId, sections, pendingChanges, tempIdCounter, page } = get();

        if (!fieldFormData.name.trim()) {
          toast.error("Field name is required");
          return;
        }

        if (!selectedSectionId) {
          toast.error("No section selected");
          return;
        }

        if (!page) {
          toast.error("No page loaded");
          return;
        }

        if (editingFieldId) {
          // Update existing field locally
          set(
            (state) => ({
              sections: state.sections.map((section: any) =>
                section.id === selectedSectionId
                  ? {
                      ...section,
                      cms_fields: section.cms_fields.map((field: any) => 
                        field.id === editingFieldId 
                          ? { ...field, ...fieldFormData } 
                          : field
                      ),
                    }
                  : section
              ),
              pendingChanges: [
                ...state.pendingChanges.filter(c => !(c.entity === 'field' && c.id === editingFieldId)),
                {
                  type: 'update',
                  entity: 'field',
                  id: editingFieldId,
                  data: fieldFormData,
                }
              ],
              isEditFieldOpen: false,
              hasUnsavedChanges: true,
            }),
            false,
            "updateFieldLocal"
          );
        } else {
          // Create new field locally
          const selectedSection = sections.find((s: any) => s.id === selectedSectionId);
          const tempId = `temp_field_${tempIdCounter}`;
          const newField = {
            id: tempId,
            ...fieldFormData,
            section_id: selectedSectionId,
            order: selectedSection?.cms_fields?.length || 0,
          };
          
          set(
            (state) => ({
              sections: state.sections.map((section: any) =>
                section.id === selectedSectionId
                  ? {
                      ...section,
                      cms_fields: [...(section.cms_fields || []), newField],
                    }
                  : section
              ),
              pendingChanges: [
                ...state.pendingChanges,
                {
                  type: 'create',
                  entity: 'field',
                  tempId: tempId,
                  data: {
                    section_id: selectedSectionId,
                    ...fieldFormData,
                    order: selectedSection?.cms_fields?.length || 0,
                  }
                }
              ],
              tempIdCounter: state.tempIdCounter + 1,
              isAddFieldOpen: false,
              hasUnsavedChanges: true,
            }),
            false,
            "createFieldLocal"
          );
        }
      },

      // Delete field - LOCAL ONLY
      deleteFieldById: (fieldId: string) => {
        const { selectedSectionId, pendingChanges } = get();
        
        set(
          (state) => {
            const isTemp = fieldId.startsWith('temp_');
            let newPendingChanges = state.pendingChanges;
            
            if (isTemp) {
              // Remove from pending changes if it's a temp item
              newPendingChanges = state.pendingChanges.filter(c => c.tempId !== fieldId);
            } else {
              // Add delete change for real fields, remove any existing changes for this field
              newPendingChanges = [
                ...state.pendingChanges.filter(c => !(c.entity === 'field' && c.id === fieldId)),
                {
                  type: 'delete',
                  entity: 'field',
                  id: fieldId,
                }
              ];
            }

            return {
              sections: state.sections.map((section: any) =>
                section.id === selectedSectionId
                  ? {
                      ...section,
                      cms_fields: section.cms_fields.filter((field: any) => field.id !== fieldId),
                    }
                  : section
              ),
              pendingChanges: newPendingChanges,
              hasUnsavedChanges: newPendingChanges.length > 0,
            };
          },
          false,
          "deleteFieldLocal"
        );
      },

      // Reorder sections locally (no change here, already local only)
      reorderSections: (activeId: string, overId: string) => {
        set(
          (state) => {
            const activeIndex = state.sections.findIndex((s: any) => s.id === activeId);
            const overIndex = state.sections.findIndex((s: any) => s.id === overId);

            if (activeIndex === -1 || overIndex === -1) return state;

            return {
              sections: arrayMove(state.sections, activeIndex, overIndex),
              hasUnsavedChanges: true,
            };
          },
          false,
          "reorderSections"
        );
      },

      // Reorder fields within a section - LOCAL ONLY
      reorderSectionFields: (sectionId: string, activeId: string, overId: string) => {
        set(
          (state) => {
            const updatedSections = state.sections.map((section: any) => {
              if (section.id === sectionId) {
                const activeIndex = section.cms_fields.findIndex((f: any) => f.id === activeId);
                const overIndex = section.cms_fields.findIndex((f: any) => f.id === overId);

                if (activeIndex === -1 || overIndex === -1) return section;

                return {
                  ...section,
                  cms_fields: arrayMove(section.cms_fields, activeIndex, overIndex),
                };
              }
              return section;
            });

            return {
              sections: updatedSections,
              hasUnsavedChanges: true,
            };
          },
          false,
          "reorderSectionFields"
        );
      },

      // Save all changes to database
      saveChanges: async () => {
        const { pendingChanges, sections, page, hasUnsavedChanges } = get();
        
        if (!hasUnsavedChanges) {
          console.log("No changes to save");
          return;
        }

        set({ isSaving: true }, false, "setSaving");

        try {
          // Prepare section order
          const sectionOrder = sections.map((s: any) => s.id);
          
          // Prepare field orders for each section
          const fieldOrders: Record<string, string[]> = {};
          sections.forEach((section: any) => {
            if (section.cms_fields && section.cms_fields.length > 0) {
              fieldOrders[section.id] = section.cms_fields.map((field: any) => field.id);
            }
          });

          // Call the bulk save action
          const result = await bulkSavePageChanges({
            pageId: page?.id || "",
            changes: pendingChanges,
            sectionOrder,
            fieldOrders,
          });

          if (!result.success) {
            throw new Error(result.error || "Failed to save changes");
          }

          // Update state with real IDs and clear pending changes
          set(
            (state) => ({
              sections: state.sections.map((section: any) => ({
                ...section,
                id: result.tempIdMap[section.id] || section.id,
                cms_fields: section.cms_fields?.map((field: any) => ({
                  ...field,
                  id: result.tempIdMap[field.id] || field.id,
                  section_id: result.tempIdMap[field.section_id] || field.section_id,
                })) || [],
              })),
              selectedSectionId: state.selectedSectionId ? 
                (result.tempIdMap[state.selectedSectionId] || state.selectedSectionId) : 
                null,
              pendingChanges: [],
              hasUnsavedChanges: false,
            }),
            false,
            "saveChangesSuccess"
          );

          toast.success("Changes saved successfully");
        } catch (error) {
          console.error("Error saving changes:", error);
          toast.error(error instanceof Error ? error.message : "Failed to save changes");
        } finally {
          set({ isSaving: false }, false, "clearSaving");
        }
      },

      // Reset all unsaved changes
      resetChanges: () => {
        const { page } = get();
        set(
          {
            sections: (page?.cms_sections || []) as any,
            selectedSectionId: page?.cms_sections?.[0]?.id || null,
            pendingChanges: [],
            hasUnsavedChanges: false,
            tempIdCounter: 1,
          },
          false,
          "resetChanges"
        );
        toast.success("Changes reset");
      },

      // Page settings actions
      openPageSettings: () => {
        const { page } = get();
        set(
          {
            isPageSettingsOpen: true,
            pageSettingsData: {
              name: page?.name || "",
              description: page?.description || "",
              slug: page?.slug || "",
              status: page?.status || "draft",
            },
          },
          false,
          "openPageSettings"
        );
      },

      closePageSettings: () => {
        set({ isPageSettingsOpen: false }, false, "closePageSettings");
      },

      setPageSettingsData: (data) => {
        set(
          (state) => ({
            pageSettingsData: { ...state.pageSettingsData, ...data },
          }),
          false,
          "setPageSettingsData"
        );
      },

      submitPageSettings: async () => {
        const { pageSettingsData, page } = get();
        
        if (!page) return;

        set({ isSaving: true }, false, "submitting");

        try {
          // Here you would call a server action to update the page
          // For now, just update local state
          set(
            (state) => ({
              page: state.page ? {
                ...state.page,
                ...pageSettingsData,
              } : null,
              isPageSettingsOpen: false,
              hasUnsavedChanges: true,
              isSaving: false,
            }),
            false,
            "submitPageSettings"
          );
          
          toast.success("Page settings updated");
        } catch (error) {
          console.error("Error updating page settings:", error);
          toast.error("Failed to update page settings");
          set({ isSaving: false }, false, "submitPageSettingsError");
        }
      },

      // Unsaved changes protection methods
      checkUnsavedChanges: (navigationCallback: () => void) => {
        const { hasUnsavedChanges } = get();
        
        if (hasUnsavedChanges) {
          set(
            {
              isUnsavedChangesDialogOpen: true,
              pendingNavigation: navigationCallback,
            },
            false,
            "showUnsavedChangesDialog"
          );
          return false; // Block navigation
        }
        
        return true; // Allow navigation
      },

      confirmUnsavedChangesDialog: () => {
        set(
          {
            isUnsavedChangesDialogOpen: false,
            pendingNavigation: null,
          },
          false,
          "closeUnsavedChangesDialog"
        );
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
            hasUnsavedChanges: false,
            pendingChanges: [],
            isUnsavedChangesDialogOpen: false,
            pendingNavigation: null,
          },
          false,
          "discardChangesAndNavigate"
        );

        // Execute the pending navigation
        if (pendingNavigation) {
          pendingNavigation();
        }
      },

      // Nested field actions
      openAddNestedFieldDialog: (parentSectionId: string) => {
        set(
          {
            fieldFormData: {
              name: "",
              type: "text",
              required: false,
              default_value: "",
              validation: "",
            },
            selectedSectionId: parentSectionId, // Set the parent section as selected
            isAddFieldOpen: true,
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
              type: field.type,
              required: field.required || false,
              default_value: field.default_value || "",
              validation: field.validation || "",
            },
            editingFieldId: field.id,
            selectedSectionId: parentSectionId, // Set the parent section as selected
            isEditFieldOpen: true,
          },
          false,
          "openEditNestedFieldDialog"
        );
      },

      deleteNestedFieldById: (fieldId: string, parentSectionId: string) => {
        set(
          (state) => {
            const isTemp = fieldId.startsWith('temp_');
            let newPendingChanges = state.pendingChanges;
            
            if (isTemp) {
              // Remove from pending changes if it's a temp item
              newPendingChanges = state.pendingChanges.filter(c => c.tempId !== fieldId);
            } else {
              // Add delete change for real fields, remove any existing changes for this field
              newPendingChanges = [
                ...state.pendingChanges.filter(c => !(c.entity === 'field' && c.id === fieldId)),
                {
                  type: 'delete',
                  entity: 'field',
                  id: fieldId,
                }
              ];
            }

            return {
              sections: state.sections.map((section: any) => {
                // Find and update the nested section recursively
                if (section.id === parentSectionId) {
                  return {
                    ...section,
                    cms_fields: section.cms_fields.filter((field: any) => field.id !== fieldId),
                  };
                }
                // Also check if this section contains nested sections
                if (section.sections) {
                  return {
                    ...section,
                    sections: section.sections.map((nestedSection: any) =>
                      nestedSection.id === parentSectionId
                        ? {
                            ...nestedSection,
                            cms_fields: nestedSection.cms_fields?.filter((field: any) => field.id !== fieldId) || [],
                          }
                        : nestedSection
                    ),
                  };
                }
                return section;
              }) as any,
              pendingChanges: newPendingChanges,
              hasUnsavedChanges: newPendingChanges.length > 0,
            };
          },
          false,
          "deleteNestedFieldLocal"
        );
      },

      // Mode switching method
      setMode: (mode: 'schema' | 'content') => {
        set({ mode }, false, "setMode");
      },
    }),
    {
      name: "page-builder-store",
    }
  )
);
