"use client"

import { GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SchemaSection } from "@/utils/schema/schema_builder_types"
import { count_items_deep } from "@/utils/schema/schema_builder_utils"

export function SectionDragPreview({ section }: { section: SchemaSection }) {
  return (
    <div className="w-[min(44rem,calc(100vw-2rem))] rounded-[26px] border border-white/15 bg-[#111111] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400">
          <GripVertical className="size-4" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{section.title}</h2>
          <Badge variant="outline" className="border-white/12 bg-white/[0.04] text-slate-200">
            {count_items_deep(section.items)} fields
          </Badge>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-black/10 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {section.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
            >
              {item.label}
            </div>
          ))}
        </div>
        {section.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 px-4 py-5 text-center text-sm text-slate-500">
            Empty section
          </div>
        ) : null}
      </div>
    </div>
  )
}
