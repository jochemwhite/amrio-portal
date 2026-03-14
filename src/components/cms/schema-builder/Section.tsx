"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";

interface SectionProps {
  section: any;
  index: number;
  isSelected: boolean;
  isSaving: boolean;
  activeDragId: string | null;
  isOverlay?: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditField: (field: any) => void;
  onDeleteField: (
    fieldId: string,
    sectionId: string,
    parentSectionId?: string,
  ) => void;
}



export function Section({
  section,
  index,
  isSelected,
  isSaving,
  activeDragId,
  isOverlay = false,
  onSelect,
  onEdit,
  onDelete,
  onEditField,
  onDeleteField,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    openAddNestedFieldDialog,
    openEditNestedFieldDialog,
    deleteNestedFieldById,
    openAddFieldDialog,
  } = useSchemaBuilderStore();

  const { ref, handleRef, isDragging } = useSortable({
    id: section.id,
    index,
    group: "sections",
    type: "section",
    accept: ["section"],
    plugins: [SortableKeyboardPlugin],
    disabled: isOverlay,
  });

  const fieldCount = section.cms_schema_fields?.length || 0;

  return (
    <div ref={isOverlay ? undefined : ref} className="group">
      {isDragging && !isOverlay ? (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10 w-full min-h-[80px]" />
      ) : (
        <Card
          className={`shadow-sm transition-all duration-200 ${isOverlay ? "cursor-grabbing shadow-xl rotate-1" : ""}`}
        >

          {/* Section Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  ref={isOverlay ? undefined : handleRef}
                  className="cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !isOverlay && setIsCollapsed(!isCollapsed)}
                  className="p-0 h-auto"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </Button>

                <div
                  className="flex-1"
                  onClick={() => !isOverlay && onSelect(section.id)}
                >
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

              {!isOverlay && (
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
              )}
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
                  {!isOverlay && (
                    <Button
                      onClick={() => openAddFieldDialog(section.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Field
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-4">
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
                            sectionId={section.id}
                            parentSectionId={section.id}
                            allFields={section.cms_schema_fields || []}
                            onEdit={() => !isOverlay && onEditField(field)}
                            onDelete={() =>
                              !isOverlay && onDeleteField(field.id, section.id)
                            }
                            onAddNestedField={
                              isOverlay ? undefined : openAddNestedFieldDialog
                            }
                            onEditNestedField={
                              isOverlay ? undefined : openEditNestedFieldDialog
                            }
                            onDeleteNestedField={
                              isOverlay ? undefined : deleteNestedFieldById
                            }
                            activeDragId={activeDragId}
                          />
                        ) : (
                          <Field
                            key={field.id}
                            field={field}
                            index={fieldIndex}
                            isSaving={isSaving}
                            sectionId={section.id}
                            onEdit={() => !isOverlay && onEditField(field)}
                            onDelete={() =>
                              !isOverlay && onDeleteField(field.id, section.id)
                            }
                            activeDragId={activeDragId}
                            allFields={section.cms_schema_fields || []}
                          />
                        ),
                      )}
                  </div>

                  {!isOverlay && (
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
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
