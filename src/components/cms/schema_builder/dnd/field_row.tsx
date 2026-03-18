"use client"

import { Edit, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { get_field_icon, get_field_type_color, get_field_type_label } from "@/utils/schema/field_types"
import type { DragHandleProps, FieldItem } from "@/utils/schema/schema_builder_types"

import { DragHandle } from "./drag_handle"

export function FieldRow({
  field,
  dragHandle,
  onEdit,
  onDelete,
  isSaving = false,
}: {
  field: FieldItem
  dragHandle: DragHandleProps
  onEdit?: () => void
  onDelete?: () => void
  isSaving?: boolean
}) {
  const fieldTypeLabel = get_field_type_label(field.databaseType)
  const fieldTypeColor = get_field_type_color(field.databaseType)
  const fieldTypeIcon = get_field_icon(field.databaseType)
  const showActions = Boolean(onEdit || onDelete)

  return (
    <div className="group rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <DragHandle {...dragHandle} />
          </div>

          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", fieldTypeColor)}>
            {fieldTypeIcon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold text-white">{field.label}</p>
              {field.required ? (
                <Badge
                  variant="outline"
                  className="border-rose-400/35 bg-rose-500/10 text-[10px] uppercase tracking-[0.08em] text-rose-200"
                >
                  Required
                </Badge>
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-slate-300">{fieldTypeLabel}</span>
              {field.defaultValue ? (
                <>
                  <span className="text-xs text-slate-600">-</span>
                  <span className="truncate text-xs text-slate-400">Default: {field.defaultValue}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {showActions ? (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSaving || !onEdit}
              onClick={onEdit}
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white"
            >
              <Edit className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSaving || !onDelete}
              onClick={onDelete}
              className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
