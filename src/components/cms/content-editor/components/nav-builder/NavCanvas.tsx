"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { NavIds } from "./nav-builder.ids"
import { NavItemRoot } from "./NavItemRoot"
import type { UseNavBuilderReturn } from "./useNavBuilder"

export function NavCanvas({
  builder,
}: {
  builder: UseNavBuilderReturn
}) {
  const rootIds = builder.items.map((item) => NavIds.root(item.id))
  const { isOver: isRootZoneOver, setNodeRef: setRootZoneNodeRef } = useDroppable({
    id: NavIds.rootZone(),
  })

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Navigation canvas</h3>
          <p className="text-sm text-muted-foreground">
            Drag pages from the sidebar or rearrange existing items directly in the menu.
          </p>
        </div>

        <Button variant="outline" onClick={builder.addBlankRootItem}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      <SortableContext items={rootIds} strategy={horizontalListSortingStrategy}>
        {builder.items.length === 0 ? (
          <div
            ref={setRootZoneNodeRef}
            className={cn(
              "flex min-h-32 items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground",
              isRootZoneOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
            )}
          >
            Drop pages here to create your root navigation
          </div>
        ) : (
          <div className="flex min-h-16 flex-wrap items-start gap-2 rounded-xl border border-dashed p-3">
            {builder.items.map((item) => (
              <NavItemRoot key={item.id} builder={builder} item={item} />
            ))}

            <div
              ref={setRootZoneNodeRef}
              className={cn(
                "flex min-h-11 min-w-28 items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground",
                isRootZoneOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
              )}
            >
              Drop here
            </div>
          </div>
        )}
      </SortableContext>
    </div>
  )
}
