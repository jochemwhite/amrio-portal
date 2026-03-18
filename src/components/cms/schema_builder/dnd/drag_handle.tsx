"use client"

import { GripVertical } from "lucide-react"

import type { DragHandleProps } from "@/utils/schema/schema_builder_types"

export function DragHandle({ attributes, listeners, setActivatorNodeRef }: DragHandleProps) {
  return (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className="flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
      {...(attributes ?? {})}
      {...(listeners ?? {})}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
