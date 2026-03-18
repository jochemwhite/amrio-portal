"use client"

import { FieldRow } from "./field_row"
import { NestedSectionRow } from "./nested_section_row"
import type { SchemaItem } from "@/utils/schema/schema_builder_types"

export function DragPreview({ item }: { item: SchemaItem }) {
  return (
    <div className="w-[min(32rem,calc(100vw-2rem))] rounded-[22px] border border-white/15 bg-[#111111] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
      {item.kind === "field" ? (
        <FieldRow
          field={item}
          dragHandle={{
            attributes: undefined,
            listeners: undefined,
            setActivatorNodeRef: undefined,
          }}
        />
      ) : (
        <NestedSectionRow
          item={item}
          dragHandle={{
            attributes: undefined,
            listeners: undefined,
            setActivatorNodeRef: undefined,
          }}
          onToggle={() => undefined}
        />
      )}
    </div>
  )
}
