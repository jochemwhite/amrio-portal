"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Field } from "./Field";
import { NestedField } from "./NestedField";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";
import {
  getFieldIcon,
  getFieldTypeColor,
  getFieldTypeLabel,
} from "../field-types";

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
  onDeleteField: (
    fieldId: string,
    sectionId: string,
    parentSectionId?: string,
  ) => void;
  onReorderFields: (
    sectionId: string,
    activeId: string,
    overId: string,
  ) => void;
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

  const {
    openAddNestedFieldDialog,
    openEditNestedFieldDialog,
    deleteNestedFieldById,
    reorderNestedFields,
    openAddFieldDialog,
  } = useSchemaBuilderStore();

  const { ref, handleRef, isDragging } = useSortable({ id: section.id, index });

  const fieldCount = section.cms_schema_fields?.length || 0;

  const handleFieldDragStart = (event: any) => {
    setActiveDragId(event.operation.source?.id ?? null);
  };

  const handleFieldDragEnd = (event: any) => {
    setActiveDragId(null);

    if (event.canceled) return;

    const { source, target } = event.operation;
    if (!source || !target || source.id === target.id) return;

    const activeField = section.cms_schema_fields?.find(
      (f: any) => f.id === source.id,
    );
    const overField = section.cms_schema_fields?.find(
      (f: any) => f.id === target.id,
    );

    if (activeField?.parent_field_id || overField?.parent_field_id) {
      reorderNestedFields(section.id, source.id as string, target.id as string);
    } else {
      onReorderFields(section.id, source.id as string, target.id as string);
    }
  };

  const draggedField = activeDragId
    ? section.cms_schema_fields?.find((f: any) => f.id === activeDragId)
    : null;

  return (
    <div ref={ref} className={`group ${isDragging ? "opacity-50" : ""}`}>
      <Card className="shadow-sm transition-all duration-200">
        {/* Section Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                ref={handleRef}
                className="cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-0 h-auto"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </Button>

              <div className="flex-1" onClick={() => onSelect(section.id)}>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium cursor-pointer">
                    {section.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Block {index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {section.description && (
                  <p className="text-sm text-gray-500 mt-1 cursor-pointer">
                    {section.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isSaving}
                className="text-gray-500 hover:text-gray-700"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isSaving}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <CardContent className="p-0">
            {fieldCount === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <Plus className="mx-auto h-8 w-8" />
                </div>
                <h4 className="text-sm font-medium mb-1">No fields yet</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Add fields to collect content for this section
                </p>
                <Button
                  onClick={() => openAddFieldDialog(section.id)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add Field
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <DragDropProvider
                  onDragStart={handleFieldDragStart}
                  onDragEnd={handleFieldDragEnd}
                >
                  <div className="space-y-2">
                    {section.cms_schema_fields
                      ?.filter((field: any) => !field.parent_field_id)
                      .map((field: any, fieldIndex: number) =>
                        field.type === "section" ? (
                          <NestedField
                            key={field.id}
                            field={field}
                            index={fieldIndex}
                            isSaving={isSaving}
                            parentSectionId={section.id}
                            allFields={section.cms_schema_fields || []}
                            onEdit={() => onEditField(field)}
                            onDelete={() => onDeleteField(field.id, section.id)}
                            onAddNestedField={openAddNestedFieldDialog}
                            onEditNestedField={openEditNestedFieldDialog}
                            onDeleteNestedField={deleteNestedFieldById}
                            activeDragId={activeDragId}
                          />
                        ) : (
                          <Field
                            key={field.id}
                            field={field}
                            index={fieldIndex}
                            isSaving={isSaving}
                            onEdit={() => onEditField(field)}
                            onDelete={() => onDeleteField(field.id, section.id)}
                            activeDragId={activeDragId}
                            allFields={section.cms_schema_fields || []}
                          />
                        ),
                      )}
                  </div>

                  <DragOverlay>
                    {draggedField ? (
                      <div className="rounded-lg border bg-card shadow-lg cursor-grabbing">
                        <div className="flex items-center space-x-3 p-3">
                          <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
                          <div
                            className={`p-2 rounded-lg ${getFieldTypeColor(draggedField.type)}`}
                          >
                            {getFieldIcon(draggedField.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {draggedField.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getFieldTypeLabel(draggedField.type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DragDropProvider>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => openAddFieldDialog(section.id)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
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
