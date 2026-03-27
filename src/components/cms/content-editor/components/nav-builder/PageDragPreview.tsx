"use client"

import { Link2 } from "lucide-react"

import type { CmsPage } from "./nav-builder.types"

export function PageDragPreview({ page }: { page: CmsPage }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xl opacity-95 rotate-1">
      <Link2 className="size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-medium">{page.title}</p>
        <p className="truncate text-xs text-muted-foreground">{page.slug}</p>
      </div>
    </div>
  )
}
