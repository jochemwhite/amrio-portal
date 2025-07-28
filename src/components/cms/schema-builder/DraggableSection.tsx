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

interface DraggableSectionProps {
  section: any;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DraggableSection({
  section,
  isSelected,
  isSaving,
  onSelect,
  onEdit,
  onDelete,
}: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:bg-muted'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1" onClick={onSelect}>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-muted rounded p-1 flex-shrink-0"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 cursor-pointer">
            <h4 className="font-medium">{section.name}</h4>
            {section.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {section.description}
              </p>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {section.cms_fields?.length || 0} field{(section.cms_fields?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
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
                <AlertDialogTitle>Delete Section</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{section.name}"? This will also delete all fields in this section. This action
                  cannot be undone.
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