import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { useState } from "react";
import { useSchemaBuilderStore } from "@/stores/useSchemaBuilderStore";
import { Section } from "./Section";

export const DraggableSectionsContainer = () => {
  // Use explicit selectors to ensure proper re-renders on nested state changes
  const sections = useSchemaBuilderStore((state) => state.sections);
  const selectedSectionId = useSchemaBuilderStore((state) => state.selectedSectionId);
  const isSaving = useSchemaBuilderStore((state) => state.isSaving);
  const setSelectedSection = useSchemaBuilderStore((state) => state.setSelectedSection);
  const openEditSectionDialog = useSchemaBuilderStore((state) => state.openEditSectionDialog);
  const deleteSectionById = useSchemaBuilderStore((state) => state.deleteSectionById);
  const openEditFieldDialog = useSchemaBuilderStore((state) => state.openEditFieldDialog);
  const deleteFieldById = useSchemaBuilderStore((state) => state.deleteFieldById);
  const reorderSections = useSchemaBuilderStore((state) => state.reorderSections);
  const reorderSectionFields = useSchemaBuilderStore((state) => state.reorderSectionFields);
  const setFieldFormData = useSchemaBuilderStore((state) => state.setFieldFormData);
  const submitField = useSchemaBuilderStore((state) => state.submitField);

  // Drag and drop handlers
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    reorderSections(active.id as string, over.id as string);
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
    <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
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
      </SortableContext>
    </DndContext>
  );
};
