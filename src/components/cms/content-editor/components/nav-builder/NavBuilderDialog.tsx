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

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  isLoading = false,
  onCancel,
  onSave,
}: {
  availablePages: CmsPage[]
  builder: UseNavBuilderReturn
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
      return item ? <NavItemDragPreview item={item} /> : null
    }

    if (parsed.type === "CHILD_ITEM") {
      const item = builder.getNestedItemById(parsed.parentId, parsed.itemId)
      return item ? <NavItemDragPreview item={item} /> : null
    }

    return null
  }

  return (
    <DialogContent
      className="h-[92vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-[calc(100vw-1rem)]"
      showCloseButton={false}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Edit Navigation</DialogTitle>
        <DialogDescription>Edit the site navigation structure in a dialog-based canvas.</DialogDescription>
      </DialogHeader>

      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <Input
            value={builder.menuName}
            onChange={(event) => builder.setMenuName(event.target.value)}
            className="h-auto max-w-md border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
            placeholder="Navigation menu name"
          />

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={isLoading || builder.isSaving} onClick={() => void onSave()}>
              {builder.isSaving ? "Saving..." : "Save Menu"}
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
          <div className="flex min-h-0 flex-1">
            <PageSidebar
              activeItemIds={builder.getActivePageIds(availablePages)}
              availablePages={availablePages}
              builder={builder}
            />
            <NavCanvas builder={builder} />
          </div>

          <DragOverlay dropAnimation={null}>{renderOverlay()}</DragOverlay>
        </DndContext>
      </div>
    </DialogContent>
  )
}
