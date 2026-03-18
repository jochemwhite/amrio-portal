"use client"

import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, PencilLine, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SchemaSection } from "@/utils/schema/schema_builder_types"
import { count_items_deep, get_section_container_id } from "@/utils/schema/schema_builder_utils"

import { ContainerSurface } from "./container_surface"
import { SortableSchemaItem } from "./sortable_schema_item"

export function SectionCard({
  canAddField = true,
  canDelete = true,
  isResetAnimating = false,
  section,
  isSelected,
  onAddField,
  onDelete,
  onDeleteField,
  onEdit,
  onEditField,
  onSelect,
  onToggleNestedSection,
}: {
  canAddField?: boolean
  canDelete?: boolean
  isResetAnimating?: boolean
  section: SchemaSection
  isSelected: boolean
  onAddField: (sectionId: string) => void
  onDelete: (sectionId: string) => void
  onDeleteField: (fieldId: string) => void
  onEdit: (sectionId: string) => void
  onEditField: (fieldId: string) => void
  onSelect: (sectionId: string) => void
  onToggleNestedSection: (itemId: string) => void
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    animateLayoutChanges: (args) =>
      isResetAnimating ? true : defaultAnimateLayoutChanges(args),
    data: {
      type: "section",
    },
  })

  return (
    <section
      ref={setNodeRef}
      data-schema-sortable-id={`section:${section.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        " border rounded-lg bg-white/[0.055] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.35)] transition-colors sm:p-6",
        isSelected ? "border-white/80" : "border-white/8",
        isDragging && "opacity-55"
      )}
      onClick={() => onSelect(section.id)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <Badge variant="outline" className="border-white/12 bg-white/[0.04] text-slate-200">
              {count_items_deep(section.items)} fields
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(section.id)
            }}
          >
            <PencilLine className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            disabled={!canDelete}
            onClick={(event) => {
              event.stopPropagation()
              onDelete(section.id)
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <ContainerSurface containerId={get_section_container_id(section.id)} depth={0} items={section.items}>
          {section.items.map((item) => (
            <SortableSchemaItem
              key={item.id}
              item={item}
              isResetAnimating={isResetAnimating}
              onDeleteField={onDeleteField}
              onEditField={onEditField}
              onToggleNestedSection={onToggleNestedSection}
            />
          ))}
        </ContainerSurface>
        <div className="mt-3 flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canAddField}
            className="h-9 rounded-lg border-white/12 bg-white/[0.02] text-white hover:bg-white/[0.08]"
            onClick={(event) => {
              event.stopPropagation()
              onAddField(section.id)
            }}
          >
            <Plus className="mr-1.5 size-3.5" />
            Add Field
          </Button>
        </div>
      </div>
    </section>
  )
}
