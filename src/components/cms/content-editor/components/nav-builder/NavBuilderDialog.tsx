"use client"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Check, Loader2, Navigation } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { NavCanvas } from "./NavCanvas"
import { NavIds } from "./nav-builder.ids"
import { NavItemDragPreview } from "./NavItemDragPreview"
import { PageDragPreview } from "./PageDragPreview"
import { PageSidebar } from "./PageSidebar"
import type { CmsPage } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) {
    return pointerHits
  }

  return closestCenter(args)
}

export function NavBuilderDialog({
  availablePages,
  builder,
  didJustSave = false,
  isLoading = false,
  onCancel,
  onSave,
}: {
  availablePages: CmsPage[]
  builder: UseNavBuilderReturn
  didJustSave?: boolean
  isLoading?: boolean
  onCancel: () => void
  onSave: () => Promise<void>
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function renderOverlay() {
    if (!builder.activeId) {
      return null
    }

    const parsed = NavIds.parse(builder.activeId)

    if (parsed.type === "PAGE") {
      const page = builder.getPageById(parsed.pageId)
      return page ? <PageDragPreview page={page} /> : null
    }

    if (parsed.type === "ROOT_ITEM") {
      const item = builder.getItemById(parsed.itemId)
      return item ? <NavItemDragPreview item={item} variant="root" /> : null
    }

    if (parsed.type === "CHILD_ITEM") {
      const item = builder.getNestedItemById(parsed.parentId, parsed.itemId)
      return item ? <NavItemDragPreview item={item} variant="child" /> : null
    }

    return null
  }

  return (
    <DialogContent
      className="h-[88vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-xl p-0 xl:max-w-[calc(100vw-3rem)]"
      showCloseButton={false}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Edit Navigation</DialogTitle>
        <DialogDescription>Edit the site navigation structure in a focused canvas.</DialogDescription>
      </DialogHeader>

      <div className="flex h-full flex-col bg-background">
        <header className="z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Navigation className="size-4 text-primary" />
            </div>

            <div className="space-y-1">
              <Input
                value={builder.menuName}
                onChange={(event) => builder.setMenuName(event.target.value)}
                className="h-9 min-w-[280px] border-none bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
                placeholder="Navigation menu name"
              />
              <p className="text-xs text-muted-foreground">
                Build, reorder, and nest your site navigation in one focused workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {builder.isDirty ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                Unsaved changes
              </span>
            ) : null}

            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              disabled={isLoading || builder.isSaving || didJustSave}
              onClick={() => void onSave()}
            >
              {builder.isSaving ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : didJustSave ? (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  Save Menu
                </>
              )}
            </Button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          measuring={measuring}
          onDragCancel={builder.handleDragCancel}
          onDragEnd={builder.handleDragEnd}
          onDragOver={builder.handleDragOver}
          onDragStart={builder.handleDragStart}
        >
          <div className="flex min-h-0 flex-1 bg-muted/10">
            <PageSidebar
              activeItemIds={builder.getActivePageIds(availablePages)}
              availablePages={availablePages}
              builder={builder}
            />
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0,_transparent_58%)]",
                builder.activeId && "cursor-grabbing"
              )}
            >
              <NavCanvas builder={builder} />
            </div>
          </div>

          <DragOverlay dropAnimation={null}>{renderOverlay()}</DragOverlay>
        </DndContext>
      </div>
    </DialogContent>
  )
}
