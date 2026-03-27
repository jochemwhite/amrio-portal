"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { Navigation, Plus } from "lucide-react"

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
    <div className="flex flex-1 flex-col overflow-hidden p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Navigation canvas</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrange top-level links across the row, then drag into an item to create sub-navigation.
        </p>
      </div>

      <SortableContext items={rootIds} strategy={horizontalListSortingStrategy}>
        {builder.items.length === 0 ? (
          <div
            ref={setRootZoneNodeRef}
            className={cn(
              "flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center text-muted-foreground transition-all duration-200",
              builder.activeId && "bg-muted/30",
              isRootZoneOver && "bg-primary/5 ring-2 ring-primary/30"
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-xl border-2 border-dashed">
              <Navigation className="size-5 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No navigation items yet</p>
              <p className="mt-0.5 text-xs opacity-70">
                Drag pages from the sidebar or click + to add a custom link
              </p>
            </div>
            <Button variant="outline" onClick={builder.addBlankRootItem}>
              <Plus className="size-4" />
              Add root item
            </Button>
          </div>
        ) : (
          <div
            ref={setRootZoneNodeRef}
            className={cn(
              "flex min-h-24 flex-wrap items-start gap-2 rounded-2xl p-4 transition-all duration-200",
              builder.activeId && "bg-muted/30",
              isRootZoneOver && "bg-primary/5 ring-2 ring-primary/30"
            )}
          >
            {builder.items.map((item) => (
              <NavItemRoot key={item.id} builder={builder} item={item} />
            ))}

            <Button
              variant="outline"
              className="h-11 rounded-xl border-dashed bg-background/80"
              onClick={builder.addBlankRootItem}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>
        )}
      </SortableContext>
    </div>
  )
}
