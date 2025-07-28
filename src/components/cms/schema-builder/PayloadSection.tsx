"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddFieldMenu } from "./AddFieldMenu";
import { PayloadField } from "./PayloadField";
import { FIELD_TYPES } from "../shared/field-types";

interface PayloadSectionProps {
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
  showAddMenu: boolean;
  onShowAddMenu: () => void;
}

export function PayloadSection({
  section,
  index,
  isSelected,
  isSaving,
  onSelect,
  onEdit,
  onDelete,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
  showAddMenu,
  onShowAddMenu,
}: PayloadSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
                <Button onClick={onShowAddMenu} size="sm" variant="outline" className="">
                  <Plus className="mr-2 h-3 w-3" />
                  Add Field
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter} 
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    onReorderFields(section.id, active.id as string, over.id as string);
                  }}
                >
                  <SortableContext items={section.cms_fields?.map((f: any) => f.id) || []} strategy={verticalListSortingStrategy}>
                    <div className="">
                      {section.cms_fields?.map((field: any) => (
                        <PayloadField
                          key={field.id}
                          field={field}
                          isSaving={isSaving}
                          onEdit={() => onEditField(field)}
                          onDelete={() => onDeleteField(field.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="mt-4 pt-4 border-t ">
                  <Button onClick={onShowAddMenu} size="sm" variant="outline" className="w-full">
                    <Plus className="mr-2 h-3 w-3" />
                    Add Field
                  </Button>
                </div>
              </div>
            )}

            {/* Add Field Menu */}
            {showAddMenu && (
              <div className="">
                <AddFieldMenu onAddField={onAddField} onClose={onShowAddMenu} fieldTypes={FIELD_TYPES} />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
