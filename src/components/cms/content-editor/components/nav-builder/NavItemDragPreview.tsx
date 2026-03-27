"use client"

import { ChevronDown, GripVertical } from "lucide-react"

import type { NavItem } from "./nav-builder.types"

export function NavItemDragPreview({ item }: { item: NavItem }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-xl rotate-1">
      <GripVertical className="size-4 text-muted-foreground" />
      <span>{item.label || "Untitled item"}</span>
      {item.children?.length ? <ChevronDown className="size-4 text-muted-foreground" /> : null}
    </div>
  )
}
