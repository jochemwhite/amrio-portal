import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Edit2, Trash2, ChevronDown, ExternalLink, FileText, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/types/cms";

interface NavigationMenuSettings {
  maxDepth: number;
  allowExternalLinks: boolean;
  allowIcons: boolean;
  allowTargetBlank: boolean;
  allowCustomClasses: boolean;
}

interface SortableMenuItemProps {
  item: MenuItem;
  depth: number;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
  settings: NavigationMenuSettings;
  isOverlay?: boolean;
}

export function SortableMenuItem({ 
  item, 
  depth, 
  onEdit, 
  onRemove, 
  onAddChild, 
  settings, 
  isOverlay = false 
}: SortableMenuItemProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging, 
    isOver: isSortableOver 
  } = useSortable({
    id: item.id,
    data: { type: "MenuItem", item, depth },
    animateLayoutChanges: () => false,
  });

  // Nesting Drop Zone (Bottom Edge)
  const { setNodeRef: setNestRef, isOver: isNestOver } = useDroppable({
    id: `nest-${item.id}`,
    data: { type: "NestZone", item, depth },
    disabled: isDragging || isOverlay
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const hasChildren = item.children && item.children.length > 0;
  const isMaxDepth = depth >= settings.maxDepth - 1;

  // Icon selection
  const Icon = item.type === "external" ? ExternalLink : 
               item.type === "anchor" ? Hash : 
               item.type === "dropdown" ? ChevronDown : FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative", 
        depth === 0 ? "inline-block mr-2 align-top pb-6" : "block mt-2 pb-4", // Add bottom padding for drop zone
        isDragging && "z-50"
      )}
    >
      {/* Item Card */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-card p-2 shadow-sm transition-all relative overflow-hidden z-10",
          // Fallback sort indicator if not nesting but sorting over
          !isNestOver && isSortableOver && !isDragging && "ring-1 ring-primary border-primary",
          depth === 0 ? "w-48" : "w-full",
          !item.visible && "opacity-60"
        )}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded z-20"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 z-0">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate block">{item.label || "Untitled"}</span>
          </div>
          {item.type === "internal" && (
            <div className="text-[10px] text-muted-foreground truncate">{item.url}</div>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-0.5 z-20", 
            !isOverlay && "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          )}
        >
          {!isMaxDepth && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => onAddChild(item.id)} 
              title="Add Sub-item"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => onEdit(item.id)} 
            title="Edit"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onRemove(item.id)}
            title="Remove"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Nesting Drop Zone Overlay (Bottom Edge/Padding) */}
      {!isDragging && !isOverlay && (
        <div 
          ref={setNestRef} 
          className={cn(
            "absolute bottom-0 left-0 right-0 z-0 transition-colors rounded-b-md",
            depth === 0 ? "h-6" : "h-4", // Match padding
            isNestOver && "bg-green-500/20 border-b-2 border-green-500"
          )}
          title="Drop here to nest"
        />
      )}

      {/* Nested Children */}
      {hasChildren && (
        <div className={cn(
          "mt-2", 
          depth === 0 ? "absolute left-0 top-full min-w-[200px] z-10 pl-0" : "pl-4 border-l ml-4"
        )}>
          <div className={cn(depth === 0 && "bg-background border rounded-md shadow-lg p-2")}>
            <SortableContext items={item.children!.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {item.children!.map((child) => (
                <SortableMenuItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                  settings={settings}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      )}
    </div>
  );
}
