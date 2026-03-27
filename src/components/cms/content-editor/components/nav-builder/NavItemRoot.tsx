"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, GripVertical, Pencil, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { DepthIndicator } from "./DepthIndicator"
import { NavIds } from "./nav-builder.ids"
import { renderNavItemIcon } from "./nav-builder.icons"
import { NavItemForm } from "./NavItemForm"
import { NavItemNested } from "./NavItemNested"
import type { NavItem } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"
import { getItemDepth, wouldExceedDepth } from "./useDepthGuard"

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
    <div className="relative flex flex-col animate-in slide-in-from-bottom-2 duration-150">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          zIndex: isDragging ? 999 : "auto",
        }}
        className="group flex flex-col"
      >
        <div
          {...attributes}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2.5 shadow-sm transition-all duration-150 select-none",
            "group-hover:border-primary/30 group-hover:shadow-md",
            isEditing && "border-primary ring-2 ring-primary/20 shadow-md",
            builder.overId === rootId && !isDragging && "border-primary/50 bg-primary/5"
          )}
        >
          <div
            ref={setActivatorNodeRef}
            className="cursor-grab rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
          </div>

          {item.icon ? <span className="text-muted-foreground">{renderNavItemIcon(item.icon, "size-3.5")}</span> : null}

          <button
            type="button"
            className="min-w-0 max-w-40 truncate text-left text-sm font-medium transition-colors hover:text-primary"
            onClick={() => builder.setEditingId(item.id)}
          >
            {item.label || "Untitled item"}
          </button>

          {item.children?.length ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.children.length}
            </span>
          ) : null}

          {item.children?.length ? <ChevronDown className="size-3.5 text-muted-foreground" /> : null}
          {!canHaveChildren ? <DepthIndicator /> : null}

          <div className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => builder.setEditingId(item.id)}
              className="rounded-md p-1 transition-colors hover:bg-muted"
            >
              <Pencil className="size-3 text-muted-foreground" />
              <span className="sr-only">Edit item</span>
            </button>
            <button
              type="button"
              className="rounded-md p-1 transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={() => builder.removeItem(item.id)}
            >
              <X className="size-3 text-muted-foreground" />
              <span className="sr-only">Remove item</span>
            </button>
          </div>
        </div>

        {isEditing && builder.editingDraft ? (
          <div className="animate-in slide-in-from-top-1 zoom-in-95 mt-2 duration-150">
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
                "mt-1 overflow-hidden rounded-lg transition-all duration-200 ease-out",
                !showChildZone && "h-0 opacity-0",
                item.children?.length && "border bg-muted/20 p-1.5",
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
                  depth={1}
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
