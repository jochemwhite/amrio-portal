"use client"

import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FolderOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SchemaItem } from "@/utils/schema/schema_builder_types"
import { count_items_deep, get_nested_container_id } from "@/utils/schema/schema_builder_utils"

import { ContainerSurface } from "./container_surface"
import { FieldRow } from "./field_row"
import { NestedSectionRow } from "./nested_section_row"

export function SortableSchemaItem({
  isResetAnimating = false,
  onDeleteField,
  item,
  onEditField,
  onToggleNestedSection,
}: {
  isResetAnimating?: boolean
  onDeleteField: (fieldId: string) => void
  item: SchemaItem
  onEditField: (fieldId: string) => void
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
    id: item.id,
    animateLayoutChanges: (args) =>
      isResetAnimating ? true : defaultAnimateLayoutChanges(args),
    data: {
      type: "item",
    },
  })

  return (
    <div
      ref={setNodeRef}
      data-schema-sortable-id={`item:${item.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("space-y-3", isDragging && "opacity-45")}
    >
      {item.kind === "field" ? (
        <FieldRow
          field={item}
          dragHandle={{
            attributes,
            listeners,
            setActivatorNodeRef,
          }}
          onDelete={() => onDeleteField(item.id)}
          onEdit={() => onEditField(item.id)}
        />
      ) : (
        <>
          <NestedSectionRow
            item={item}
            dragHandle={{
              attributes,
              listeners,
              setActivatorNodeRef,
            }}
            onToggle={() => onToggleNestedSection(item.id)}
          />
          {item.open ? (
            <div className="pl-5 sm:pl-10">
              <div className="mb-3 flex items-center gap-2 px-1 text-sky-400">
                <FolderOpen className="size-4" />
                <span className="text-sm font-semibold">{item.label}_Fields</span>
                <Badge variant="outline" className="border-white/10 bg-black/10 text-slate-100">
                  {count_items_deep(item.items)} fields
                </Badge>
              </div>
              <ContainerSurface
                containerId={get_nested_container_id(item.id)}
                depth={1}
                items={item.items}
              >
                {item.items.map((nestedItem) => (
                  <SortableSchemaItem
                    key={nestedItem.id}
                    item={nestedItem}
                    isResetAnimating={isResetAnimating}
                    onDeleteField={onDeleteField}
                    onEditField={onEditField}
                    onToggleNestedSection={onToggleNestedSection}
                  />
                ))}
              </ContainerSurface>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
