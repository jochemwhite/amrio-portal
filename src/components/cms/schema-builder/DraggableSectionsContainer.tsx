import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { useState } from "react";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { PayloadSection } from "./PayloadSection";
import { AddSectionMenu } from "./AddSectionMenu";
import { FIELD_TYPES } from "../shared";

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
  } = usePageBuilderStore();

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
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section, index: number) => (
              <PayloadSection
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
                showAddMenu={false}
                onShowAddMenu={() => {}}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddSectionMenu />
    </div>
  );
};
