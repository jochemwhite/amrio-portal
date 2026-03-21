import { useDraggable } from "@dnd-kit/core";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import type { BuilderFieldType } from "../types";

interface PaletteItemProps {
  type: BuilderFieldType;
  label: string;
  icon: ElementType;
}

export function PaletteItem({ type, label, icon: Icon }: PaletteItemProps) {
  const id = `palette:${type}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      source: "palette",
      fieldType: type,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "w-full cursor-grab touch-none select-none rounded-md border border-border bg-card px-3 py-4 text-left transition hover:border-primary/40 hover:bg-muted/50 active:cursor-grabbing",
        isDragging && "cursor-grabbing opacity-60",
      )}
      {...attributes}
      {...listeners}
    >
      <Icon className="mb-2 h-4 w-4 text-foreground/80" />
      <p className="text-sm font-semibold text-foreground">{label}</p>
    </button>
  );
}
