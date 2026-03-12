import { DragDropProvider } from "@dnd-kit/react";
import React from "react";
import { Section } from "./Section";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";
import { useShallow } from "zustand/react/shallow";

export const DraggableSectionsContainer = () => {
  const {
    sections,
    selectedSectionId,
    isSaving,
    setSelectedSection,
    openEditSectionDialog,
    deleteSectionById,
    openEditFieldDialog,
    deleteFieldById,
    reorderSections,
    reorderSectionFields,
    setFieldFormData,
    submitField,
  } = useSchemaBuilderStore(
    useShallow((state) => ({
      sections: state.sections,
      selectedSectionId: state.selectedSectionId,
      isSaving: state.isSaving,
      setSelectedSection: state.setSelectedSection,
      openEditSectionDialog: state.openEditSectionDialog,
      deleteSectionById: state.deleteSectionById,
      openEditFieldDialog: state.openEditFieldDialog,
      deleteFieldById: state.deleteFieldById,
      reorderSections: state.reorderSections,
      reorderSectionFields: state.reorderSectionFields,
      setFieldFormData: state.setFieldFormData,
      submitField: state.submitField,
    }))
  );

  const handleSectionDragEnd = (event: any) => {
    if (event.canceled) return;

    const { source, target } = event.operation;
    if (!source || !target || source.id === target.id) return;

    reorderSections(source.id as string, target.id as string);
  };

  const handleFieldReorder = (sectionId: string, activeId: string, overId: string) => {
    reorderSectionFields(sectionId, activeId, overId);
  };

  const handleAddField = (sectionId: string, fieldData: any) => {
    setSelectedSection(sectionId);
    setFieldFormData(fieldData);
    submitField();
  };

  return (
    // SortableContext and verticalListSortingStrategy are gone —
    // @dnd-kit/react handles this implicitly via useSortable's index prop
    <DragDropProvider onDragEnd={handleSectionDragEnd}>
      <div className="space-y-4">
        {sections.map((section, index: number) => (
          <Section
            key={section.id}
            section={section}
            index={index}
            isSelected={selectedSectionId === section.id}
            isSaving={isSaving}
            onSelect={(id: string) => setSelectedSection(id)}
            onEdit={() => openEditSectionDialog(section)}
            onDelete={() => deleteSectionById(section.id)}
            onAddField={(fieldData: any) => handleAddField(section.id, fieldData)}
            onEditField={openEditFieldDialog}
            onDeleteField={deleteFieldById}
            onReorderFields={handleFieldReorder}
          />
        ))}
      </div>
    </DragDropProvider>
  );
};