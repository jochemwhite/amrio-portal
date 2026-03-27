"use client"

import { useDraggable } from "@dnd-kit/core"
import { Check, Link2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { NavIds } from "./nav-builder.ids"
import type { CmsPage } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"

export function PageSidebar({
  activeItemIds,
  availablePages,
  builder,
}: {
  activeItemIds: string[]
  availablePages: CmsPage[]
  builder: UseNavBuilderReturn
}) {
  const filteredPages = availablePages.filter((page) =>
    page.title.toLowerCase().includes(builder.pageSearch.toLowerCase())
  )

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="sticky top-0 z-10 space-y-2 border-b bg-background px-3 py-3">
        <Input
          value={builder.pageSearch}
          onChange={(event) => builder.setPageSearch(event.target.value)}
          placeholder="Search pages"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 py-2">
          {filteredPages.map((page) => (
            <PageSidebarRow
              key={page.id}
              isActive={activeItemIds.includes(page.id)}
              page={page}
            />
          ))}
          {filteredPages.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No pages match your search.</p>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {builder.isCustomLinkFormOpen ? (
          <div className="space-y-2 rounded-lg border bg-background p-3">
            <Input
              value={builder.customLinkDraft.label}
              onChange={(event) => builder.updateCustomLinkDraft({ label: event.target.value })}
              placeholder="Link label"
            />
            <Input
              value={builder.customLinkDraft.href}
              onChange={(event) => builder.updateCustomLinkDraft({ href: event.target.value })}
              placeholder="https://example.com"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={builder.closeCustomLinkForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={builder.addCustomLink}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full justify-start" onClick={builder.openCustomLinkForm}>
            <Plus className="size-4" />
            Create custom link
          </Button>
        )}
      </div>
    </aside>
  )
}

function PageSidebarRow({
  isActive,
  page,
}: {
  isActive: boolean
  page: CmsPage
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: NavIds.page(page.id),
    disabled: isActive,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
        isActive
          ? "cursor-not-allowed text-muted-foreground"
          : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <Link2 className="size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", isActive && "text-muted-foreground")}>{page.title}</p>
        <p className="truncate text-xs text-muted-foreground">{page.slug}</p>
      </div>
      {isActive ? (
        <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          <Check className="mr-1 size-3" />
          Added
        </span>
      ) : null}
    </div>
  )
}
