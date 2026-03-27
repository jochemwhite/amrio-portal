"use client"

import { FileText, GripVertical } from "lucide-react"

import { renderNavItemIcon } from "./nav-builder.icons"
import type { NavItem } from "./nav-builder.types"

export function NavItemDragPreview({
  item,
  variant = "root",
}: {
  item: NavItem
  variant?: "root" | "child"
}) {
  if (variant === "child") {
    return (
      <div className="flex cursor-grabbing items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-sm shadow-lg ring-1 ring-primary/20 rotate-1 scale-105">
        <FileText className="size-3 text-muted-foreground" />
        <span>{item.label || "Untitled item"}</span>
      </div>
    )
  }

  return (
      <div className="flex cursor-grabbing items-center gap-2 rounded-xl border bg-background px-3 py-2.5 text-sm font-medium shadow-xl ring-2 ring-primary/20 -rotate-1 scale-105">
        <GripVertical className="size-3.5 text-muted-foreground" />
      {renderNavItemIcon(item.icon, "size-3.5 text-muted-foreground")}
      <span>{item.label || "Untitled item"}</span>
      {item.children?.length ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.children.length}
        </span>
      ) : null}
    </div>
  )
}
