"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { Field as TField } from "@/types/cms";
import { closestCenter, DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { getFieldIcon, getFieldTypeLabel, getFieldTypeColor } from "../shared/field-types";
import { useState } from "react";
import { Field } from "./Field";
import { NestedField } from "./NestedField";

interface SectionProps {
  section: any;
  index: number;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddField: (fieldData: any) => void;
  onEditField: (field: any) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderFields: (sectionId: string, activeId: string, overId: string) => void;
  
}

export function Section({
  section,
  index,
  isSelected,
  isSaving,
  onSelect,
  onEdit,
  onDelete,
  onEditField,
  onDeleteField,
  onReorderFields,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Get nested field methods from store
  const { openAddNestedFieldDialog, openEditNestedFieldDialog, deleteNestedFieldById, reorderNestedFields, openAddFieldDialog } =
    usePageBuilderStore();

  // Configure sensors for field dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require dragging 3px before activating (reduced for smoother feel)
      },
    })
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldCount = section.cms_fields?.length || 0;

  // Custom collision detection that respects nesting levels
  const customCollisionDetection = (args: any) => {
    const { active, droppableContainers } = args;

    // If we're dragging a nested field, only allow drops on other nested fields within the same parent
    const activeField = section.cms_fields?.find((f: any) => f.id === active.id);
    if (activeField?.parent_field_id) {
      // Only allow drops on fields with the same parent_field_id (exclude the parent field itself)
      const validTargets = droppableContainers.filter((container: any) => {
        const targetField = section.cms_fields?.find((f: any) => f.id === container.id);
        return targetField && targetField.parent_field_id === activeField.parent_field_id && targetField.id !== activeField.parent_field_id; // Exclude the parent field itself
      });
      return closestCenter({ ...args, droppableContainers: validTargets });
    }

    // If we're dragging a top-level field, only allow drops on other top-level fields
    const topLevelTargets = droppableContainers.filter((container: any) => {
      const targetField = section.cms_fields?.find((f: any) => f.id === container.id);
      return targetField && !targetField.parent_field_id;
    });
    return closestCenter({ ...args, droppableContainers: topLevelTargets });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Check if this is a nested field reorder
    const activeField = section.cms_fields?.find((f: any) => f.id === active.id);
    const overField = section.cms_fields?.find((f: any) => f.id === over.id);

    if (activeField?.parent_field_id || overField?.parent_field_id) {
      // This is a nested field reorder
      reorderNestedFields(section.id, active.id as string, over.id as string);
    } else {
      // This is a regular field reorder
      onReorderFields(section.id, active.id as string, over.id as string);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`group ${isDragging ? "opacity-50" : ""}`}>
      <Card className={`shadow-sm  transition-all duration-200 `}>
        {/* Section Header */}
        <div className="p-4 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div {...attributes} {...listeners} className="cursor-grab  rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-0 h-auto">
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </Button>

              <div className="flex-1" onClick={() => onSelect(section.id)}>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium  cursor-pointer">{section.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    Block {index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {section.description && <p className="text-sm text-gray-500 mt-1 cursor-pointer">{section.description}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={onEdit} disabled={isSaving} className="text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} disabled={isSaving} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <CardContent className="p-0">
            {fieldCount === 0 ? (
              <div className="p-8 text-center    ">
                <div className="text-gray-400 mb-3">
                  <Plus className="mx-auto h-8 w-8" />
                </div>
                <h4 className="text-sm font-medium  mb-1">No fields yet</h4>
                <p className="text-xs text-gray-500 mb-4">Add fields to collect content for this section</p>
                <Button onClick={() => openAddFieldDialog()} size="sm" variant="outline" className="">
                  <Plus className="mr-2 h-3 w-3" />
                  Add Field
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext items={section.cms_fields?.map((f: TField) => f.id) || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {section.cms_fields
                        ?.filter((field: any) => !field.parent_field_id)
                        .map((field: any) =>
                          field.type === "section" ? (
                            <NestedField
                              key={field.id}
                              field={field}
                              isSaving={isSaving}
                              parentSectionId={section.id} // Pass the real parent section ID
                              allFields={section.cms_fields || []} // Pass all fields to find nested ones
                              onEdit={() => onEditField(field)}
                              onDelete={() => onDeleteField(field.id)}
                              onAddNestedField={openAddNestedFieldDialog}
                              onEditNestedField={openEditNestedFieldDialog}
                              onDeleteNestedField={deleteNestedFieldById}
                              activeDragId={activeDragId}
                            />
                          ) : (
                            <Field
                              key={field.id}
                              field={field}
                              isSaving={isSaving}
                              onEdit={() => onEditField(field)}
                              onDelete={() => onDeleteField(field.id)}
                              activeDragId={activeDragId}
                              allFields={section.cms_fields || []}
                            />
                          )
                        )}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeDragId ? (
                      (() => {
                        const draggedField = section.cms_fields?.find((f: any) => f.id === activeDragId);
                        if (!draggedField) return null;
                        
                        return draggedField.type === "section" ? (
                          <div className="group rounded-lg border hover:shadow-sm">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="cursor-grab rounded p-1 opacity-100">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className={`p-2 rounded-lg ${getFieldTypeColor(draggedField.type)}`}>
                                  {getFieldIcon(draggedField.type)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{draggedField.name}</h4>
                                  <span className="text-xs text-gray-500">Nested Section</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="group rounded-lg border hover:shadow-sm">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="cursor-grab rounded p-1 opacity-100">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className={`p-2 rounded-lg ${getFieldTypeColor(draggedField.type)}`}>
                                  {getFieldIcon(draggedField.type)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{draggedField.name}</h4>
                                  <span className="text-xs text-gray-500">{getFieldTypeLabel(draggedField.type)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : null}
                  </DragOverlay>
                </DndContext>

                <div className="mt-4 pt-4 border-t ">
                  <Button onClick={() => openAddFieldDialog()} size="sm" variant="outline" className="w-full">
                    <Plus className="mr-2 h-3 w-3" />
                    Add Field
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
