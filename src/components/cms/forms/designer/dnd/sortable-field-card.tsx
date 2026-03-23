import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { getFieldTypeDefinition } from "../field-type-registry";
import type { BuilderField } from "../types";

interface SortableFieldCardProps {
  field: BuilderField;
  isSelected: boolean;
  isOver: boolean;
  onSelect: () => void;
  onLableChange: (nextLabel: string) => void;
  onToggleRequired: () => void;
  onDelete: () => void;
}

export function SortableFieldCard({
  field,
  isSelected,
  isOver,
  onSelect,
  onLableChange,
  onToggleRequired,
  onDelete,
}: SortableFieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `field:${field.id}`,
  });
  const definition = getFieldTypeDefinition(field.type);
  const FieldIcon = definition.icon;
  const displayLabel =
    definition.supportsLabel === false
      ? field.content || definition.label
      : field.label;

  return (
    <div
      ref={setNodeRef}
      data-field-id={field.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={cn(
        "relative cursor-grab touch-none select-none rounded-md border border-border bg-card px-3 py-4 active:cursor-grabbing",
        isSelected && "ring-2 ring-primary/70",
        isOver && "border-primary/70 bg-primary/5",
        isDragging && "cursor-grabbing opacity-60",
      )}
    >
      <button
        type="button"
        className="absolute right-2 top-2 rounded p-1 text-foreground/50 hover:bg-muted hover:text-foreground active:cursor-grabbing cursor-pointer"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4 " />
      </button>
      <div>
        <Badge
          variant={field.required ? "outline" : "secondary"}
          className="cursor-pointer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleRequired();
          }}
        >
          {field.required ? "Required" : "Optional"}
        </Badge>
      </div>
      <div className="flex items-center">
        <div className="mb-2 flex items-center gap-2 pr-8 text-foreground/80">
          <FieldIcon className="h-10 w-10" />
          <span className="text-xs uppercase tracking-wide">{field.type}</span>
        </div>

        <div className="pr-8">
          {definition.supportsLabel === false ? (
            <p className="px-2 text-sm font-semibold text-foreground">
              {displayLabel}
            </p>
          ) : (
            <Input
              value={field.label}
              onChange={(event) => onLableChange(event.target.value)}
              data-field-label-input={field.id}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              className="h-8 border-transparent bg-transparent px-2 text-sm font-semibold text-foreground shadow-none focus-visible:border-border focus-visible:bg-background"
              aria-label="Field label"
            />
          )}
        </div>
      </div>
    </div>
  );
}
