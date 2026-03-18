"use client"

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "snapchat",
  "reddit",
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "messenger",
  "youtube",
  "twitch",
  "github",
] as const

type PlatformSetting = {
  order: number
  icon: string
}

type SocialMediaSettingsProps = {
  value: Record<string, unknown> | null
  setValue: (value: Record<string, unknown> | null) => void
}

export function SocialMediaSettings({ value, setValue }: SocialMediaSettingsProps) {
  const selectedPlatforms = normalize_platforms(value?.platforms)

  function handle_platform_toggle(platformIcon: string, checked: boolean) {
    let updated: PlatformSetting[]

    if (checked) {
      const maxOrder =
        selectedPlatforms.length > 0 ? Math.max(...selectedPlatforms.map((platform) => platform.order)) : -1
      updated = [...selectedPlatforms, { order: maxOrder + 1, icon: platformIcon }]
    } else {
      updated = selectedPlatforms
        .filter((platform) => platform.icon !== platformIcon)
        .map((platform, index) => ({ ...platform, order: index }))
    }

    setValue({ platforms: updated })
  }

  function handle_drag_end(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId || activeId === overId) {
      return
    }

    const oldIndex = selectedPlatforms.findIndex((platform) => platform.icon === activeId)
    const newIndex = selectedPlatforms.findIndex((platform) => platform.icon === overId)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const reordered = arrayMove(selectedPlatforms, oldIndex, newIndex).map((platform, index) => ({
      ...platform,
      order: index,
    }))
    setValue({ platforms: reordered })
  }

  return (
    <Field>
      <FieldLabel>Select Social Platforms</FieldLabel>

      {selectedPlatforms.length > 0 ? (
        <div className="mb-4 space-y-2">
          <FieldLabel className="text-sm">Selected Platforms (drag to reorder)</FieldLabel>
          <DndContext collisionDetection={closestCenter} onDragEnd={handle_drag_end}>
            <SortableContext
              items={selectedPlatforms.map((platform) => platform.icon)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedPlatforms.map((platform) => (
                  <SortablePlatformItem
                    key={platform.icon}
                    platform={platform}
                    onRemove={(icon) => handle_platform_toggle(icon, false)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-2 gap-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.some((selected) => selected.icon === platform)
          return (
            <div key={platform} className="flex items-center gap-2">
              <Checkbox
                id={`platform-${platform}`}
                checked={isSelected}
                onCheckedChange={(checked) => handle_platform_toggle(platform, checked === true)}
              />
              <label
                htmlFor={`platform-${platform}`}
                className="cursor-pointer text-sm leading-none font-medium capitalize"
              >
                {platform === "x" ? "X (Twitter)" : platform}
              </label>
            </div>
          )
        })}
      </div>

      <FieldDescription>
        Select social platforms to include. Drag selected platforms to reorder them.
      </FieldDescription>
    </Field>
  )
}

function SortablePlatformItem({
  platform,
  onRemove,
}: {
  platform: PlatformSetting
  onRemove: (icon: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: platform.icon,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-white/10 bg-background p-2 hover:bg-accent/50",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm font-medium capitalize">
        {platform.icon === "x" ? "X (Twitter)" : platform.icon}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-6 w-6 p-0"
        onClick={() => onRemove(platform.icon)}
      >
        ×
      </Button>
    </div>
  )
}

function normalize_platforms(platforms: unknown): PlatformSetting[] {
  if (!Array.isArray(platforms)) {
    return []
  }

  if (platforms.length === 0) {
    return []
  }

  if (typeof platforms[0] === "object" && platforms[0] !== null) {
    return (platforms as Array<{ order?: number; icon?: string }>).map((platform, index) => ({
      order: platform.order ?? index,
      icon: platform.icon ?? "",
    }))
  }

  return (platforms as string[]).map((icon, index) => ({
    order: index,
    icon,
  }))
}
