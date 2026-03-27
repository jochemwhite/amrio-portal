"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { DepthIndicator } from "./DepthIndicator"
import { NavIds } from "./nav-builder.ids"
import { NavItemForm } from "./NavItemForm"
import type { NavItem } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"

export function NavItemNested({
  builder,
  depth,
  item,
  parentId,
}: {
  builder: UseNavBuilderReturn
  depth: number
  item: NavItem
  parentId: string
}) {
  const itemId = NavIds.child(parentId, item.id)
  const childZoneId = NavIds.childZone(item.id)
  const childIds = (item.children ?? []).map((child) => NavIds.child(item.id, child.id))
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
  })
  const canHaveChildren = builder.canNestAtDepth(depth)
  const showChildPanel = builder.shouldShowChildZone(item.id)
  const { isOver: isChildZoneOver, setNodeRef: setChildZoneNodeRef } = useDroppable({
    id: childZoneId,
    disabled: !canHaveChildren,
  })

  return (
    <div className="space-y-2">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          zIndex: isDragging ? 999 : "auto",
        }}
        className="group rounded-md"
      >
        <div
          {...attributes}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
            builder.overId === itemId && "ring-2 ring-primary ring-offset-2 bg-primary/5"
          )}
        >
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="text-muted-foreground"
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>

          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => builder.setEditingId(item.id)}
          >
            <p className="truncate font-medium">{item.label || "Untitled item"}</p>
            <p className="truncate text-xs text-muted-foreground">{item.href || "/"}</p>
          </button>

          {!canHaveChildren ? <DepthIndicator /> : null}

          <Button variant="ghost" size="icon-sm" onClick={() => builder.removeItem(item.id)}>
            <Trash2 className="size-4" />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>

        {builder.editingId === item.id && builder.editingDraft ? (
          <div className="ml-6 mt-2">
            <NavItemForm
              draft={builder.editingDraft}
              onCancel={builder.cancelEditing}
              onChange={builder.updateEditingDraft}
              onSave={builder.saveEditingItem}
            />
          </div>
        ) : null}
      </div>

      {canHaveChildren ? (
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setChildZoneNodeRef}
            style={{
              minHeight: showChildPanel ? 60 : item.children?.length ? undefined : 8,
            }}
            className={cn(
              "ml-6 space-y-1 rounded-lg transition-all duration-150",
              (item.children?.length || showChildPanel) && "border bg-muted/20 p-2",
              isChildZoneOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
            )}
          >
            {item.children?.map((child) => (
              <NavItemNested
                key={child.id}
                builder={builder}
                depth={depth + 1}
                item={child}
                parentId={item.id}
              />
            ))}

            {showChildPanel ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground">
                <Plus className="size-3.5" />
                Drop item here
              </div>
            ) : null}
          </div>
        </SortableContext>
      ) : null}
    </div>
  )
}
