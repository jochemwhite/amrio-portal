"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GripVertical, Edit, Trash2, ChevronDown, ChevronRight, Plus, FolderOpen } from "lucide-react";
import { getFieldIcon, getFieldTypeLabel, getFieldTypeColor } from "../shared/field-types";
import { Field } from "./Field";

interface NestedFieldProps {
  field: any;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  depth?: number;
  parentSectionId?: string; // Add the real parent section ID
  allFields?: any[]; // All fields in the parent section to find nested ones
  onAddNestedField?: (parentSectionId: string, parentFieldId?: string) => void;
  onEditNestedField?: (field: any, parentSectionId: string) => void;
  onDeleteNestedField?: (fieldId: string, parentSectionId: string) => void;
  activeDragId?: string | null; // Add activeDragId prop
}

export function NestedField({
  field,
  isSaving,
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    transformOrigin: "0 0", // Ensure drag preview starts from top-left
  };

  // Check if this is a nested section field
  const isNestedSectionField = field.type === "section";

  // Get actual nested fields for this section field
  const nestedFields = isNestedSectionField ? allFields.filter((f: any) => f.parent_field_id === field.id) : [];

  const nestedSection = isNestedSectionField
    ? {
        id: `nested_${field.id}`,
        name: `${field.name} Section`,
        fields: nestedFields,
      }
    : null;




  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-2 ${isDragging ? "opacity-0" : ""}`}
    >
      {/* Main Field */}
      <div className="group rounded-lg border hover:shadow-sm">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab  rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4" />
            </div>

            {isNestedSectionField && nestedSection && (
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-1 h-auto">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}

            <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>{getFieldIcon(field.type)}</div>

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
                {/* Visual indicator for nested fields */}
                {isNestedSectionField && (
                  <Badge variant="secondary" className="text-xs  ">
                    Nested Section
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{getFieldTypeLabel(field.type)}</span>
                {isNestedSectionField && nestedSection && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-blue-600">
                      {nestedSection.name} ({nestedSection.fields?.length || 0} fields)
                    </span>
                  </>
                )}
                {field.default_value && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">Default: {field.default_value}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit} disabled={isSaving} className="text-gray-500 hover:text-gray-700">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={isSaving} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Nested Section Fields */}
      {isNestedSectionField && nestedSection && isExpanded && (
        <div className={`ml-6 space-y-2 ${isDragging ? "hidden" : ""}`}>
          <Card className=" ">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{nestedSection.name} Fields</span>
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
                  <p className="text-xs text-muted-foreground">No fields in this nested section yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {nestedSection.fields.map((nestedField: any) =>
                    nestedField.type === "section" ? (
                      <NestedField
                        key={nestedField.id}
                        field={nestedField}
                        isSaving={isSaving}
                        depth={depth + 1}
                        parentSectionId={parentSectionId}
                        allFields={allFields}
                        onEdit={() => onEditNestedField?.(nestedField, parentSectionId!)}
                        onDelete={() => onDeleteNestedField?.(nestedField.id, parentSectionId!)}
                        onAddNestedField={onAddNestedField}
                        onEditNestedField={onEditNestedField}
                        onDeleteNestedField={onDeleteNestedField}
                        activeDragId={activeDragId}
                      />
                    ) : (
                      <Field
                        key={nestedField.id}
                        field={nestedField}
                        isSaving={isSaving}
                        onEdit={() => onEditNestedField?.(nestedField, parentSectionId!)}
                        onDelete={() => onDeleteNestedField?.(nestedField.id, parentSectionId!)}
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
