"use client"

import { FileText } from "lucide-react"

import type { CmsPage } from "./nav-builder.types"

export function PageDragPreview({ page }: { page: CmsPage }) {
  return (
    <div className="flex cursor-grabbing items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-xl ring-2 ring-primary/20 rotate-2 scale-105">
      <FileText className="size-3.5 text-primary" />
      <div className="min-w-0">
        <p>{page.title}</p>
        <p className="truncate text-xs font-normal text-muted-foreground">{page.slug}</p>
      </div>
    </div>
  )
}
