import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CMSStore, Section, Field } from '@/types/cms';
import { wouldCreateLoop, MAX_NESTING_DEPTH, calculateSectionDepth } from '@/components/cms/shared/section-utils';

export const useCMSStore = create<CMSStore>()(
  devtools(
    (set, get) => ({
      sections: [],

      // Section management
      addSection: (name: string, description?: string) => {
        const newSection: Section = {
          id: uuidv4(),
          name,
          description,
          fields: [],
          sections: [], // Initialize nested sections array
          depth: 0, // Root sections start at depth 0
        };
        
        set((state) => ({
          sections: [...state.sections, newSection],
        }), false, 'addSection');
      },

      updateSection: (id: string, data: Partial<Section>) => {
        set((state) => ({
          sections: updateSectionRecursively(state.sections, id, data),
        }), false, 'updateSection');
      },

      removeSection: (id: string) => {
        set((state) => ({
          sections: removeSectionRecursively(state.sections, id),
        }), false, 'removeSection');
      },

      // Field management with nested section support
      addField: (sectionId: string, field: Omit<Field, 'id'>) => {
        const newField: Field = {
          id: uuidv4(),
          ...field,
          order: field.order ?? get().sections.find(s => s.id === sectionId)?.fields.length ?? 0,
        };
        
        set((state) => ({
          sections: addFieldToSectionRecursively(state.sections, sectionId, newField),
        }), false, 'addField');
      },

      updateField: (sectionId: string, fieldId: string, data: Partial<Field>) => {
        set((state) => ({
          sections: updateFieldRecursively(state.sections, sectionId, fieldId, data),
        }), false, 'updateField');
      },

      removeField: (sectionId: string, fieldId: string) => {
        set((state) => ({
          sections: removeFieldRecursively(state.sections, sectionId, fieldId),
        }), false, 'removeField');
      },

      reorderFields: (sectionId: string, newFields: Field[]) => {
        set((state) => ({
          sections: reorderFieldsRecursively(state.sections, sectionId, newFields),
        }), false, 'reorderFields');
      },

      // New methods for nested section management
      addNestedSection: (parentSectionId: string, childSectionId: string) => {
        const state = get();
        const parentSection = findSectionRecursively(state.sections, parentSectionId);
        const childSection = findSectionRecursively(state.sections, childSectionId);
        
        if (!parentSection || !childSection) {
          console.error('Parent or child section not found');
          return;
        }

        // Prevent loops
        if (wouldCreateLoop(parentSection, childSection, state.sections)) {
          console.error('Cannot add section: would create a loop');
          return;
        }

        // Check depth limits
        const newDepth = (parentSection.depth || 0) + 1;
        if (newDepth > MAX_NESTING_DEPTH) {
          console.error(`Cannot add section: would exceed maximum depth of ${MAX_NESTING_DEPTH}`);
          return;
        }

        // Add the child section to the parent
        const updatedChildSection: Section = {
          ...childSection,
          parentSectionId: parentSectionId,
          depth: newDepth,
        };

        set((state) => ({
          sections: addNestedSectionRecursively(state.sections, parentSectionId, updatedChildSection),
        }), false, 'addNestedSection');
      },

      removeNestedSection: (parentSectionId: string, childSectionId: string) => {
        set((state) => ({
          sections: removeNestedSectionRecursively(state.sections, parentSectionId, childSectionId),
        }), false, 'removeNestedSection');
      },

      // Schema management
      loadSchema: (sections: Section[]) => {
        set({ sections: sections.map(normalizeSection) }, false, 'loadSchema');
      },

      exportSchema: () => {
        return get().sections;
      },

      // Utility methods for nested sections
      getSectionById: (id: string) => {
        return findSectionRecursively(get().sections, id);
      },

      getAllSections: () => {
        return flattenAllSections(get().sections);
      },

      getAvailableParentSections: (sectionId: string) => {
        const state = get();
        const section = findSectionRecursively(state.sections, sectionId);
        if (!section) return [];

        return state.sections.filter(s => 
          s.id !== sectionId && 
          !wouldCreateLoop(s, section, state.sections) &&
          calculateSectionDepth(s) < MAX_NESTING_DEPTH
        );
      },
    }),
    {
      name: 'cms-store',
    }
  )
);

// Helper functions for recursive section operations
function updateSectionRecursively(sections: Section[], id: string, data: Partial<Section>): Section[] {
  return sections.map(section => {
    if (section.id === id) {
      return { ...section, ...data };
    }
    if (section.sections) {
      return {
        ...section,
        sections: updateSectionRecursively(section.sections, id, data),
      };
    }
    return section;
  });
}

function removeSectionRecursively(sections: Section[], id: string): Section[] {
  return sections
    .filter(section => section.id !== id)
    .map(section => ({
      ...section,
      sections: section.sections ? removeSectionRecursively(section.sections, id) : undefined,
    }));
}

function addFieldToSectionRecursively(sections: Section[], sectionId: string, field: Field): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        fields: [...section.fields, field],
      };
    }
    if (section.sections) {
      return {
        ...section,
        sections: addFieldToSectionRecursively(section.sections, sectionId, field),
      };
    }
    return section;
  });
}

function updateFieldRecursively(sections: Section[], sectionId: string, fieldId: string, data: Partial<Field>): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        fields: section.fields.map(field =>
          field.id === fieldId ? { ...field, ...data } : field
        ),
      };
    }
    if (section.sections) {
      return {
        ...section,
        sections: updateFieldRecursively(section.sections, sectionId, fieldId, data),
      };
    }
    return section;
  });
}

function removeFieldRecursively(sections: Section[], sectionId: string, fieldId: string): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        fields: section.fields.filter(field => field.id !== fieldId),
      };
    }
    if (section.sections) {
      return {
        ...section,
        sections: removeFieldRecursively(section.sections, sectionId, fieldId),
      };
    }
    return section;
  });
}

function reorderFieldsRecursively(sections: Section[], sectionId: string, newFields: Field[]): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return { ...section, fields: newFields };
    }
    if (section.sections) {
      return {
        ...section,
        sections: reorderFieldsRecursively(section.sections, sectionId, newFields),
      };
    }
    return section;
  });
}

function addNestedSectionRecursively(sections: Section[], parentId: string, childSection: Section): Section[] {
  return sections.map(section => {
    if (section.id === parentId) {
      return {
        ...section,
        sections: [...(section.sections || []), childSection],
      };
    }
    if (section.sections) {
      return {
        ...section,
        sections: addNestedSectionRecursively(section.sections, parentId, childSection),
      };
    }
    return section;
  });
}

function removeNestedSectionRecursively(sections: Section[], parentId: string, childId: string): Section[] {
  return sections.map(section => {
    if (section.id === parentId) {
      return {
        ...section,
        sections: section.sections?.filter(child => child.id !== childId) || [],
      };
    }
    if (section.sections) {
      return {
        ...section,
        sections: removeNestedSectionRecursively(section.sections, parentId, childId),
      };
    }
    return section;
  });
}

function findSectionRecursively(sections: Section[], id: string): Section | null {
  for (const section of sections) {
    if (section.id === id) {
      return section;
    }
    if (section.sections) {
      const found = findSectionRecursively(section.sections, id);
      if (found) return found;
    }
  }
  return null;
}

function flattenAllSections(sections: Section[]): Section[] {
  const flattened: Section[] = [];
  
  function addSection(section: Section) {
    flattened.push(section);
    if (section.sections) {
      section.sections.forEach(addSection);
    }
  }
  
  sections.forEach(addSection);
  return flattened;
}

function normalizeSection(section: Section): Section {
  return {
    ...section,
    sections: section.sections?.map(normalizeSection) || [],
    depth: section.depth || 0,
  };
}