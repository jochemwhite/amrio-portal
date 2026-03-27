"use client"

import { useDraggable } from "@dnd-kit/core"
import { CheckCircle2, FileText, GripVertical, Link as LinkIcon, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { NavIds } from "./nav-builder.ids"
import type { CmsPage } from "./nav-builder.types"
import type { UseNavBuilderReturn } from "./useNavBuilder"

type PageGroup = {
  label: string | null
  pages: CmsPage[]
}

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
  const groupedPages = groupPages(filteredPages, availablePages)

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-muted/20">
      <div className="px-4 pb-2 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pages
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={builder.pageSearch}
            onChange={(event) => builder.setPageSearch(event.target.value)}
            placeholder="Search pages..."
            className="h-8 bg-background pl-8 pr-8 text-sm"
          />
          {builder.pageSearch ? (
            <button
              type="button"
              onClick={() => builder.setPageSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              <span className="sr-only">Clear search</span>
            </button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="pb-4">
          {groupedPages.map((group) => (
            <div key={group.label ?? "pages"} className="mb-4">
              {group.label ? (
                <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              ) : null}

              <div className="space-y-1">
                {group.pages.map((page) => (
                  <PageSidebarRow
                    key={page.id}
                    isActive={activeItemIds.includes(page.id)}
                    page={page}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredPages.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No pages match your search.
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {builder.isCustomLinkFormOpen ? (
          <div className="animate-in slide-in-from-bottom-2 duration-150 space-y-2">
            <Input
              value={builder.customLinkDraft.label}
              onChange={(event) => builder.updateCustomLinkDraft({ label: event.target.value })}
              placeholder="Label"
              className="h-8 text-sm"
            />
            <Input
              value={builder.customLinkDraft.href}
              onChange={(event) => builder.updateCustomLinkDraft({ href: event.target.value })}
              placeholder="https://"
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 flex-1" onClick={builder.addCustomLink}>
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={builder.closeCustomLinkForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={builder.openCustomLinkForm}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <LinkIcon className="size-3.5" />
            Add custom link
          </button>
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
        "group flex select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100",
        isActive
          ? "cursor-not-allowed opacity-50"
          : "cursor-grab hover:bg-background hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className={cn(
          "size-3.5 shrink-0 transition-opacity",
          isActive ? "opacity-0" : "opacity-0 group-hover:opacity-40"
        )}
      />

      <div className="flex size-6 shrink-0 items-center justify-center rounded border bg-background">
        <FileText className="size-3 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{page.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{page.slug}</p>
      </div>

      {isActive ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
      ) : (
        <Plus className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  )
}

function groupPages(filteredPages: CmsPage[], allPages: CmsPage[]): PageGroup[] {
  const pageMap = new Map(allPages.map((page) => [page.id, page]))
  const grouped = new Map<string, PageGroup>()

  for (const page of filteredPages) {
    const key = page.parentId ?? "root"
    const label = page.parentId ? pageMap.get(page.parentId)?.title ?? "Nested pages" : null
    const existingGroup = grouped.get(key)

    if (existingGroup) {
      existingGroup.pages.push(page)
      continue
    }

    grouped.set(key, {
      label,
      pages: [page],
    })
  }

  return Array.from(grouped.values())
}
