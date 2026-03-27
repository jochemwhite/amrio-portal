"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FileText, GripVertical, Pencil, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { DepthIndicator } from "./DepthIndicator"
import { NavIds } from "./nav-builder.ids"
import { NavItemForm } from "./NavItemForm"
import type { NavItem } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"
import { getItemDepth, wouldExceedDepth } from "./useDepthGuard"

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
  const isEditing = builder.editingId === item.id
  const isDraggingAnything = Boolean(builder.activeId)
  const showChildZone = Boolean(item.children?.length) || isDraggingAnything
  const { isOver: isChildZoneOver, setNodeRef: setChildZoneNodeRef } = useDroppable({
    id: childZoneId,
    disabled: !canHaveChildren,
  })
  const isInvalidChildZone =
    canHaveChildren &&
    isChildZoneOver &&
    isInvalidChildDrop(builder, item.id)

  return (
    <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-150">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          zIndex: isDragging ? 999 : "auto",
        }}
        className="group rounded-lg"
      >
        <div
          {...attributes}
          className={cn(
            "mx-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-100",
            "hover:bg-background hover:shadow-sm",
            isEditing && "bg-background shadow-sm ring-2 ring-primary/20",
            builder.overId === itemId && "bg-primary/5 ring-2 ring-primary/30"
          )}
        >
          <div
            ref={setActivatorNodeRef}
            className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical className="size-3 text-muted-foreground" />
          </div>

          <div className="flex size-5 shrink-0 items-center justify-center rounded border bg-muted">
            <FileText className="size-2.5 text-muted-foreground" />
          </div>

          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => builder.setEditingId(item.id)}
          >
            <p className="truncate font-medium leading-tight">{item.label || "Untitled item"}</p>
            <p className="truncate text-[11px] text-muted-foreground/70">{item.href || "/"}</p>
          </button>

          {!canHaveChildren ? <DepthIndicator /> : null}

          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => builder.setEditingId(item.id)}
              className="rounded-md p-1 transition-colors hover:bg-muted"
            >
              <Pencil className="size-2.5 text-muted-foreground" />
              <span className="sr-only">Edit item</span>
            </button>
            <button
              type="button"
              onClick={() => builder.removeItem(item.id)}
              className="rounded-md p-1 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-2.5 text-muted-foreground" />
              <span className="sr-only">Remove item</span>
            </button>
          </div>
        </div>

        {isEditing && builder.editingDraft ? (
          <div className="animate-in slide-in-from-top-1 zoom-in-95 ml-6 mt-2 duration-150">
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
        <div className="relative">
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div
              ref={setChildZoneNodeRef}
              className={cn(
                "ml-6 overflow-hidden rounded-lg transition-all duration-200 ease-out",
                !showChildZone && "h-0 opacity-0",
                item.children?.length && "border bg-muted/20 p-2",
                isDraggingAnything && !item.children?.length && "h-12 border border-dashed border-muted-foreground/30",
                isDraggingAnything && !item.children?.length && "flex items-center justify-center",
                isChildZoneOver && !isInvalidChildZone && "border-primary/60 bg-primary/5 ring-2 ring-primary/30",
                isInvalidChildZone && "border-destructive/30 bg-destructive/5 ring-2 ring-destructive/20"
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

              {isDraggingAnything && !item.children?.length && !isChildZoneOver ? (
                <p className="pointer-events-none text-[11px] text-muted-foreground/50">
                  Drop here to nest
                </p>
              ) : null}

              {isChildZoneOver && !isInvalidChildZone && !item.children?.length ? (
                <p className="pointer-events-none text-[11px] text-primary/70">
                  Release to add as sub-item
                </p>
              ) : null}
            </div>
          </SortableContext>

          {isInvalidChildZone ? (
            <div className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground animate-in fade-in duration-100">
              Max nesting depth reached
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function isInvalidChildDrop(builder: UseNavBuilderReturn, parentId: string) {
  if (!builder.activeId) {
    return false
  }

  const activeData = NavIds.parse(builder.activeId)

  if (activeData.type === "PAGE") {
    return getItemDepth(builder.items, parentId) + 1 > builder.maxDepth - 1
  }

  if (activeData.type === "ROOT_ITEM" || activeData.type === "CHILD_ITEM") {
    return wouldExceedDepth(builder.items, activeData.itemId, parentId, builder.maxDepth)
  }

  return false
}
