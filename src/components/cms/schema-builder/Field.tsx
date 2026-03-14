"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import {
  getFieldIcon,
  getFieldTypeColor,
  getFieldTypeLabel,
} from "../field-types";

interface FieldProps {
  field: any;
  index: number;
  sectionId: string;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  activeDragId?: string | null;
  allFields?: any[];
}

export function Field({
  field,
  index,
  sectionId,
  isSaving,
  onEdit,
  onDelete,
  activeDragId,
  allFields = [],
}: FieldProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: field.id,
    index,
    group: sectionId,
    type: "field",
    accept: ["field"],
  });

  // FIX #4: Removed unnecessary getFieldById store call. The `field` prop
  // already contains all the data we need — calling getFieldById added an
  // extra store subscription on every render and mixed two sources of truth.
  // Use `field` consistently for everything.
  if (!field) return null;

  return (
    <div
      ref={ref}
      // Use `invisible` (visibility:hidden) instead of `opacity-0` while dragging.
      // opacity-0 keeps the node fully painted and in React's ownership, which
      // causes a "removeChild" NotFoundError when dnd-kit's portal overlay
      // unmounts and React tries to reconcile the same node from two places.
      // visibility:hidden hides it from painting but keeps it in the DOM layout
      // tree so React never loses track of node ownership.
      className={`group rounded-lg border ${isDragging ? "invisible" : "hover:shadow-sm"}`}
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 flex-1">
          <div
            ref={handleRef}
            className="cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>
            {getFieldIcon(field.type)}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{field.name}</h4>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {getFieldTypeLabel(field.type)}
              </span>
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
  );
}