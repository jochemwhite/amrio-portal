"use client"

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"

import { cn } from "@/lib/utils"
import type { SchemaItem } from "@/utils/schema/schema_builder_types"

export function ContainerSurface({
  containerId,
  depth,
  items,
  children,
}: {
  containerId: string
  depth: number
  items: SchemaItem[]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: {
      type: "container",
      depth,
    },
  })

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-3 rounded-[22px] border p-5 transition-colors",
          depth === 0
            ? "border-white/8 bg-black/10"
            : "border-sky-500/20 bg-sky-500/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          isOver && "border-white/30 bg-white/6"
        )}
      >
        {items.length > 0 ? (
          children
        ) : (
          <div className="rounded-[18px] border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400">
            Drop a field here
          </div>
        )}
      </div>
    </SortableContext>
  )
}
