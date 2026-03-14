"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  FolderOpen,
} from "lucide-react";
import { Field } from "./Field";
import { getFieldIcon, getFieldTypeColor, getFieldTypeLabel } from "../field-types";
// import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";

interface NestedFieldProps {
  field: any;
  index: number;
  isSaving: boolean;
  sectionId: string;
  onEdit: () => void;
  onDelete: () => void;
  depth?: number;
  parentSectionId?: string;
  allFields?: any[];
  onAddNestedField?: (parentSectionId: string, parentFieldId?: string) => void;
  onEditNestedField?: (field: any, parentSectionId: string) => void;
  onDeleteNestedField?: (fieldId: string, parentSectionId: string) => void;
  activeDragId?: string | null;
}

export function NestedField({
  field,
  index,
  isSaving,
  sectionId,
  onEdit,
  onDelete,
  depth = 0,
  parentSectionId,
  allFields = [],
  onAddNestedField,
  onEditNestedField,
  onDeleteNestedField,
  activeDragId,
}: NestedFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { ref, handleRef, isDragging } = useSortable({
    id: field.id,
    index,
    group: sectionId,
    type: "field",
    accept: ["field"],
  });

  const isNestedSectionField = field.type === "section";
  const nestedFields = isNestedSectionField
    ? allFields.filter((f: any) => f.parent_field_id === field.id)
    : [];
  const nestedSection = isNestedSectionField
    ? {
        id: `nested_${field.id}`,
        name: `${field.name} Section`,
        fields: nestedFields,
      }
    : null;

  return (
    <div ref={ref} className={`space-y-2 ${isDragging ? "opacity-0" : ""}`}>
      {/* Main Field */}
      <div className="group rounded-lg border hover:shadow-sm">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3 flex-1">
            <div
              ref={handleRef}
              className="cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {isNestedSectionField && nestedSection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-auto"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>
              {getFieldIcon(field.type)}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{field.name}</h4>
                {field.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
                {depth > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Nested
                  </Badge>
                )}
                {isNestedSectionField && (
                  <Badge variant="secondary" className="text-xs">
                    Nested Section
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {getFieldTypeLabel(field.type)}
                </span>
                {isNestedSectionField && nestedSection && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-blue-600">
                      {nestedSection.name} ({nestedSection.fields?.length || 0}{" "}
                      fields)
                    </span>
                  </>
                )}
                {field.default_value && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Default: {field.default_value}
                    </span>
                  </>
                )}
              </div>
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
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isSaving}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Nested Section Fields */}
      {isNestedSectionField && nestedSection && isExpanded && (
        <div className={`ml-6 space-y-2 ${isDragging ? "hidden" : ""}`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {nestedSection.name} Fields
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {nestedSection.fields?.length || 0} fields
                  </Badge>
                </div>
                {onAddNestedField && parentSectionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddNestedField(parentSectionId, field.id)}
                    disabled={isSaving}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Field
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!nestedSection.fields || nestedSection.fields.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    No fields in this nested section yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {nestedSection.fields.map(
                    (nestedField: any, nestedIndex: number) =>
                      nestedField.type === "section" ? (
                        <NestedField
                          key={nestedField.id}
                          field={nestedField}
                          index={nestedIndex}
                          isSaving={isSaving}
                          sectionId={sectionId}
                          depth={depth + 1}
                          parentSectionId={parentSectionId}
                          allFields={allFields}
                          onEdit={() =>
                            onEditNestedField?.(nestedField, parentSectionId!)
                          }
                          onDelete={() =>
                            onDeleteNestedField?.(
                              nestedField.id,
                              parentSectionId!
                            )
                          }
                          onAddNestedField={onAddNestedField}
                          onEditNestedField={onEditNestedField}
                          onDeleteNestedField={onDeleteNestedField}
                          activeDragId={activeDragId}
                        />
                      ) : (
                        <Field
                          key={nestedField.id}
                          field={nestedField}
                          index={nestedIndex}
                          isSaving={isSaving}
                          sectionId={sectionId}
                          onEdit={() =>
                            onEditNestedField?.(nestedField, parentSectionId!)
                          }
                          onDelete={() =>
                            onDeleteNestedField?.(
                              nestedField.id,
                              parentSectionId!
                            )
                          }
                        />
                      )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}