"use client"

import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DragHandleProps, NestedSectionItem } from "@/utils/schema/schema_builder_types"
import { count_items_deep } from "@/utils/schema/schema_builder_utils"

import { DragHandle } from "./drag_handle"

export function NestedSectionRow({
  item,
  dragHandle,
  onToggle,
}: {
  item: NestedSectionItem
  dragHandle: DragHandleProps
  onToggle: () => void
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex items-start gap-3">
        <DragHandle {...dragHandle} />
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          {item.open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
          <FolderOpen className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-white">{item.label}</p>
            <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100">
              Nested Section
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Nested Section <span className="mx-1 text-slate-600">-</span>
            <span className="text-sky-400">{count_items_deep(item.items)} fields</span>
          </p>
        </div>
      </div>
    </div>
  )
}
