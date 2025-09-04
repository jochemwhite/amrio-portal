"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { getFieldIcon, getFieldTypeLabel, getFieldTypeColor } from "../shared/field-types";

interface PayloadFieldProps {
  field: any;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  activeDragId?: string | null; // Add activeDragId prop
  allFields?: any[]; // Add allFields prop for compatibility checking
}

export function PayloadField({ field, isSaving, onEdit, onDelete, activeDragId, allFields = [] }: PayloadFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine if this field should show drop indicator
  const shouldShowDropIndicator = activeDragId && activeDragId !== field.id;
  const activeField = allFields.find((f: any) => f.id === activeDragId);
  const isCompatibleDropTarget =
    activeField &&
    // If dragging a nested field, only show indicator on other nested fields with same parent (exclude parent field)
    ((activeField.parent_field_id && field.parent_field_id === activeField.parent_field_id && field.id !== activeField.parent_field_id) ||
      // If dragging a top-level field, only show indicator on other top-level fields
      (!activeField.parent_field_id && !field.parent_field_id));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-sm"} ${
        shouldShowDropIndicator && isCompatibleDropTarget ? "ring-2 ring-blue-400 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-gray-100 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>{getFieldIcon(field.type)}</div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium ">{field.name}</h4>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 ">
              <span className="text-xs text-gray-500">{getFieldTypeLabel(field.type)}</span>
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
  );
}
