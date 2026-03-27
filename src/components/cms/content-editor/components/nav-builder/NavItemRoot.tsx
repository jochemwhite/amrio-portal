"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, GripVertical, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { DepthIndicator } from "./DepthIndicator"
import { NavIds } from "./nav-builder.ids"
import { NavItemForm } from "./NavItemForm"
import { NavItemNested } from "./NavItemNested"
import type { NavItem } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"

export function NavItemRoot({
  builder,
  item,
}: {
  builder: UseNavBuilderReturn
  item: NavItem
}) {
  const rootId = NavIds.root(item.id)
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
    id: rootId,
  })
  const canHaveChildren = builder.canNestAtDepth(0)
  const showChildPanel = builder.shouldShowChildZone(item.id)
  const { isOver: isChildZoneOver, setNodeRef: setChildZoneNodeRef } = useDroppable({
    id: childZoneId,
    disabled: !canHaveChildren,
  })

  return (
    <div className="relative flex flex-col">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          zIndex: isDragging ? 999 : "auto",
        }}
        className="group"
      >
        <div
          {...attributes}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-shadow hover:shadow-md",
            builder.overId === rootId && "ring-2 ring-primary ring-offset-2 bg-primary/5"
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
            className="max-w-40 truncate text-left"
            onClick={() => builder.setEditingId(item.id)}
          >
            {item.label || "Untitled item"}
          </button>

          {item.children?.length ? <ChevronDown className="size-4 text-muted-foreground" /> : null}
          {!canHaveChildren ? <DepthIndicator /> : null}

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => builder.removeItem(item.id)}
          >
            <X className="size-4" />
            <span className="sr-only">Remove item</span>
          </button>
        </div>
      </div>

      {builder.editingId === item.id || canHaveChildren ? (
        <div className="mt-1 min-w-48 space-y-2">
          {builder.editingId === item.id && builder.editingDraft ? (
            <div className="w-80 rounded-lg border bg-popover p-2 shadow-lg">
              <NavItemForm
                draft={builder.editingDraft}
                onCancel={builder.cancelEditing}
                onChange={builder.updateEditingDraft}
                onSave={builder.saveEditingItem}
              />
            </div>
          ) : null}

          {canHaveChildren ? (
            <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
              <div
                ref={setChildZoneNodeRef}
                style={{
                  minHeight: showChildPanel ? 60 : item.children?.length ? undefined : 8,
                }}
                className={cn(
                  "min-w-48 rounded-lg transition-all duration-150",
                  (item.children?.length || showChildPanel) && "border bg-popover p-1.5 shadow-lg",
                  isChildZoneOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
                )}
              >
                {item.children?.length ? (
                  <div className="space-y-0.5">
                    {item.children.map((child) => (
                      <NavItemNested
                        key={child.id}
                        builder={builder}
                        depth={1}
                        item={child}
                        parentId={item.id}
                      />
                    ))}
                  </div>
                ) : null}

                {showChildPanel ? (
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground">
                    <Plus className="size-3.5" />
                    Drop item here
                  </div>
                ) : null}
              </div>
            </SortableContext>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
