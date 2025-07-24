"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "richtext", label: "Rich Text" },
  { value: "image", label: "Image" },
  { value: "reference", label: "Reference" },
];

interface DraggableFieldProps {
  field: any;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function DraggableField({
  field,
  isSaving,
  onEdit,
  onDelete,
}: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-muted rounded p-1 flex-shrink-0"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{field.name}</h4>
              <Badge variant="outline" className="text-xs">
                {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
              </Badge>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {field.default_value && (
              <p className="text-xs text-muted-foreground mt-1">
                Default: {field.default_value}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={isSaving}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" disabled={isSaving}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Field</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the field "{field.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
} 