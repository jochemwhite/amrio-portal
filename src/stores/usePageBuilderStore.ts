import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from 'sonner';
import { createSection, updateSection, deleteSection, createField, updateField, deleteField, reorderFields } from '@/actions/cms/section-actions';
import { arrayMove } from '@dnd-kit/sortable';

interface PageBuilderState {
  // Core data
  page: any | null;
  sections: any[];
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
  
  // Actions
  initializeStore: (page: any, websiteId: string) => void;
  setSelectedSection: (sectionId: string | null) => void;
  
  // Section actions
  openAddSectionDialog: () => void;
  openEditSectionDialog: (section: any) => void;
  closeSectionDialog: () => void;
  setSectionFormData: (data: Partial<PageBuilderState['sectionFormData']>) => void;
  submitSection: () => Promise<void>;
  deleteSectionById: (sectionId: string) => Promise<void>;
  
  // Field actions
  openAddFieldDialog: () => void;
  openEditFieldDialog: (field: any) => void;
  closeFieldDialog: () => void;
  setFieldFormData: (data: Partial<PageBuilderState['fieldFormData']>) => void;
  submitField: () => Promise<void>;
  deleteFieldById: (fieldId: string) => Promise<void>;
  
  // Reordering actions
  reorderSections: (activeId: string, overId: string) => void;
  reorderSectionFields: (sectionId: string, activeId: string, overId: string) => Promise<void>;
}

export const usePageBuilderStore = create<PageBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      page: null,
      sections: [],
      websiteId: '',
      selectedSectionId: null,
      hasUnsavedChanges: false,
      isSaving: false,
      
      // Section form state
      isAddSectionOpen: false,
      isEditSectionOpen: false,
      editingSectionId: null,
      sectionFormData: {
        name: '',
        description: '',
      },
      
      // Field form state
      isAddFieldOpen: false,
      isEditFieldOpen: false,
      editingFieldId: null,
      fieldFormData: {
        name: '',
        type: 'text',
        required: false,
        default_value: '',
        validation: '',
      },
      
      // Initialize store with page data
      initializeStore: (page: any, websiteId: string) => {
        set({
          page,
          sections: page.cms_sections || [],
          websiteId,
          selectedSectionId: page.cms_sections?.[0]?.id || null,
          hasUnsavedChanges: false,
        }, false, 'initializeStore');
      },
      
      // Set selected section
      setSelectedSection: (sectionId: string | null) => {
        set({ selectedSectionId: sectionId }, false, 'setSelectedSection');
      },
      
      // Section dialog actions
      openAddSectionDialog: () => {
        set({
          sectionFormData: { name: '', description: '' },
          isAddSectionOpen: true,
        }, false, 'openAddSectionDialog');
      },
      
      openEditSectionDialog: (section: any) => {
        set({
          sectionFormData: {
            name: section.name,
            description: section.description || '',
          },
          editingSectionId: section.id,
          isEditSectionOpen: true,
        }, false, 'openEditSectionDialog');
      },
      
      closeSectionDialog: () => {
        set({
          isAddSectionOpen: false,
          isEditSectionOpen: false,
          editingSectionId: null,
        }, false, 'closeSectionDialog');
      },
      
      setSectionFormData: (data) => {
        set((state) => ({
          sectionFormData: { ...state.sectionFormData, ...data }
        }), false, 'setSectionFormData');
      },
      
      // Submit section (create or update)
      submitSection: async () => {
        const { sectionFormData, editingSectionId, page, sections } = get();
        
        if (!sectionFormData.name.trim()) {
          toast.error('Section name is required');
          return;
        }
        
        set({ isSaving: true }, false, 'setSaving');
        
        try {
          if (editingSectionId) {
            // Update existing section
            const result = await updateSection(editingSectionId, {
              name: sectionFormData.name,
              description: sectionFormData.description,
            });
            
            if (result.success) {
                           set((state) => ({
               sections: state.sections.map((s: any) => 
                 s.id === editingSectionId 
                   ? { ...s, name: sectionFormData.name, description: sectionFormData.description }
                   : s
               ),
               isEditSectionOpen: false,
               hasUnsavedChanges: true,
             }), false, 'updateSectionSuccess');
              toast.success('Section updated successfully');
            } else {
              console.error('Failed to update section:', result.error);
              toast.error(result.error || 'Failed to update section');
            }
          } else {
            // Create new section
            const result = await createSection({
              page_id: page.id,
              name: sectionFormData.name,
              description: sectionFormData.description,
            });
            
            if (result.success) {
              const newSection = {
                ...result.data,
                cms_fields: []
              };
              set((state) => ({
                sections: [...state.sections, newSection],
                selectedSectionId: newSection.id,
                isAddSectionOpen: false,
                hasUnsavedChanges: true,
              }), false, 'createSectionSuccess');
              toast.success('Section created successfully');
            } else {
              console.error('Failed to create section:', result.error);
              toast.error(result.error || 'Failed to create section');
            }
          }
        } catch (error) {
          console.error('Error in submitSection:', error);
          toast.error('An unexpected error occurred');
        } finally {
          set({ isSaving: false }, false, 'clearSaving');
        }
      },
      
      // Delete section
      deleteSectionById: async (sectionId: string) => {
        set({ isSaving: true }, false, 'setSaving');
        
        try {
          const result = await deleteSection(sectionId);
          if (result.success) {
                       set((state) => ({
             sections: state.sections.filter((s: any) => s.id !== sectionId),
             selectedSectionId: state.selectedSectionId === sectionId 
               ? (state.sections.filter((s: any) => s.id !== sectionId)[0]?.id || null) 
               : state.selectedSectionId,
             hasUnsavedChanges: true,
           }), false, 'deleteSectionSuccess');
            toast.success('Section deleted successfully');
          } else {
            console.error('Failed to delete section:', result.error);
            toast.error(result.error || 'Failed to delete section');
          }
        } catch (error) {
          console.error('Error in deleteSectionById:', error);
          toast.error('An unexpected error occurred');
        } finally {
          set({ isSaving: false }, false, 'clearSaving');
        }
      },
      
      // Field dialog actions
      openAddFieldDialog: () => {
        const { selectedSectionId } = get();
        if (!selectedSectionId) {
          toast.error('Please select a section first');
          return;
        }
        set({
          fieldFormData: {
            name: '',
            type: 'text',
            required: false,
            default_value: '',
            validation: '',
          },
          isAddFieldOpen: true,
        }, false, 'openAddFieldDialog');
      },
      
      openEditFieldDialog: (field: any) => {
        set({
          fieldFormData: {
            name: field.name,
            type: field.type,
            required: field.required || false,
            default_value: field.default_value || '',
            validation: field.validation || '',
          },
          editingFieldId: field.id,
          isEditFieldOpen: true,
        }, false, 'openEditFieldDialog');
      },
      
      closeFieldDialog: () => {
        set({
          isAddFieldOpen: false,
          isEditFieldOpen: false,
          editingFieldId: null,
        }, false, 'closeFieldDialog');
      },
      
      setFieldFormData: (data) => {
        set((state) => ({
          fieldFormData: { ...state.fieldFormData, ...data }
        }), false, 'setFieldFormData');
      },
      
      // Submit field (create or update)
      submitField: async () => {
        const { fieldFormData, editingFieldId, selectedSectionId, sections } = get();
        
        if (!fieldFormData.name.trim()) {
          toast.error('Field name is required');
          return;
        }
        
        if (!selectedSectionId) {
          toast.error('No section selected');
          return;
        }
        
        set({ isSaving: true }, false, 'setSaving');
        
        try {
          if (editingFieldId) {
            // Update existing field
            const result = await updateField(editingFieldId, {
              name: fieldFormData.name,
              type: fieldFormData.type as any,
              required: fieldFormData.required,
              default_value: fieldFormData.default_value,
              validation: fieldFormData.validation,
            });
            
            if (result.success) {
                           set((state) => ({
               sections: state.sections.map((section: any) => 
                 section.id === selectedSectionId
                   ? {
                       ...section,
                       cms_fields: section.cms_fields.map((field: any) =>
                         field.id === editingFieldId
                           ? { ...field, ...fieldFormData }
                           : field
                       )
                     }
                   : section
               ),
               isEditFieldOpen: false,
               hasUnsavedChanges: true,
             }), false, 'updateFieldSuccess');
              toast.success('Field updated successfully');
                       } else {
             console.error('Failed to update field:', result.error);
             toast.error(result.error || 'Failed to update field');
           }
          } else {
            // Create new field
                         const selectedSection = sections.find((s: any) => s.id === selectedSectionId);
            const result = await createField({
              section_id: selectedSectionId,
              name: fieldFormData.name,
              type: fieldFormData.type as any,
              required: fieldFormData.required,
              default_value: fieldFormData.default_value,
              validation: fieldFormData.validation,
              order: selectedSection?.cms_fields?.length || 0,
            });
            
            if (result.success) {
                           set((state) => ({
               sections: state.sections.map((section: any) => 
                 section.id === selectedSectionId
                   ? {
                       ...section,
                       cms_fields: [...(section.cms_fields || []), result.data]
                     }
                   : section
               ),
               isAddFieldOpen: false,
               hasUnsavedChanges: true,
             }), false, 'createFieldSuccess');
              toast.success('Field created successfully');
            } else {
              console.error('Failed to create field:', result.error);
              toast.error(result.error || 'Failed to create field');
            }
          }
        } catch (error) {
          console.error('Error in submitField:', error);
          toast.error('An unexpected error occurred');
        } finally {
          set({ isSaving: false }, false, 'clearSaving');
        }
      },
      
      // Delete field
      deleteFieldById: async (fieldId: string) => {
        const { selectedSectionId } = get();
        set({ isSaving: true }, false, 'setSaving');
        
        try {
          const result = await deleteField(fieldId);
          if (result.success) {
                       set((state) => ({
             sections: state.sections.map((section: any) => 
               section.id === selectedSectionId
                 ? {
                     ...section,
                     cms_fields: section.cms_fields.filter((field: any) => field.id !== fieldId)
                   }
                 : section
             ),
             hasUnsavedChanges: true,
           }), false, 'deleteFieldSuccess');
            toast.success('Field deleted successfully');
          } else {
            console.error('Failed to delete field:', result.error);
            toast.error(result.error || 'Failed to delete field');
          }
        } catch (error) {
          console.error('Error in deleteFieldById:', error);
          toast.error('An unexpected error occurred');
        } finally {
          set({ isSaving: false }, false, 'clearSaving');
        }
      },
      
      // Reorder sections locally (optimistic update)
      reorderSections: (activeId: string, overId: string) => {
        set((state) => {
          const activeIndex = state.sections.findIndex((s: any) => s.id === activeId);
          const overIndex = state.sections.findIndex((s: any) => s.id === overId);
          
          if (activeIndex === -1 || overIndex === -1) return state;
          
          return {
            sections: arrayMove(state.sections, activeIndex, overIndex),
            hasUnsavedChanges: true,
          };
        }, false, 'reorderSections');
      },
      
      // Reorder fields within a section
      reorderSectionFields: async (sectionId: string, activeId: string, overId: string) => {
        // Optimistic update
        set((state) => {
          const updatedSections = state.sections.map((section: any) => {
            if (section.id === sectionId) {
              const activeIndex = section.cms_fields.findIndex((f: any) => f.id === activeId);
              const overIndex = section.cms_fields.findIndex((f: any) => f.id === overId);
              
              if (activeIndex === -1 || overIndex === -1) return section;
              
              return {
                ...section,
                cms_fields: arrayMove(section.cms_fields, activeIndex, overIndex)
              };
            }
            return section;
          });
          
          return {
            sections: updatedSections,
            hasUnsavedChanges: true,
          };
        }, false, 'reorderSectionFields');
        
        // Update in database
        try {
          const section = get().sections.find((s: any) => s.id === sectionId);
          if (!section) return;
          
          const fieldIds = section.cms_fields.map((f: any) => f.id);
          const result = await reorderFields(sectionId, fieldIds);
          
          if (!result.success) {
            console.error('Failed to reorder fields:', result.error);
            toast.error('Failed to save field order');
          }
        } catch (error) {
          console.error('Error reordering fields:', error);
          toast.error('Failed to save field order');
        }
      },
    }),
    {
      name: 'page-builder-store',
    }
  )
); 