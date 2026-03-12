"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";
import { getFieldIcon, getFieldTypeColor, getFieldTypeLabel } from "../field-types";

interface FieldProps {
  field: any;
  index: number; // required by @dnd-kit/react/sortable
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  activeDragId?: string | null;
  allFields?: any[];
}

export function Field({ field, index, isSaving, onEdit, onDelete, activeDragId, allFields = [] }: FieldProps) {
  const { ref, isDragging } = useSortable({ id: field.id, index });
  const { getFieldById } = useSchemaBuilderStore();

  const fieldData = getFieldById(field.id);
  if (!fieldData) return null;

  const shouldShowDropIndicator = activeDragId && activeDragId !== field.id;
  const activeField = allFields.find((f: any) => f.id === activeDragId);
  const isCompatibleDropTarget =
    activeField &&
    ((activeField.parent_field_id && field.parent_field_id === activeField.parent_field_id && field.id !== activeField.parent_field_id) ||
      (!activeField.parent_field_id && !field.parent_field_id));

  return (
    <div
      ref={ref}
      className={`group rounded-lg border ${isDragging ? "opacity-0" : "hover:shadow-sm"}`}
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 flex-1">
          {/* In @dnd-kit/react, the drag handle is declared via the `handle` option  */}
          {/* or by passing handleRef to the handle element. Here we use a data attr  */}
          {/* approach: mark the grip as the handle via useSortable's handleRef.       */}
          <div className="cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>{getFieldIcon(field.type)}</div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{fieldData.name}</h4>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
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