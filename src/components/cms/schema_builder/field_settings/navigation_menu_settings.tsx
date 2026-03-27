"use client"

import { Input } from "@/components/ui/input"

type NavigationMenuSettingsProps = {
  value: Record<string, unknown> | null
  setValue: (value: Record<string, unknown> | null) => void
  open?: boolean
  collectionId?: string | null
  setCollectionId?: (value: string | null) => void
  error?: string | null
  onCollectionTouched?: () => void
}

const MIN_DEPTH = 1
const MAX_DEPTH = 3

export function NavigationMenuSettings({
  value,
  setValue,
}: NavigationMenuSettingsProps) {
  const maxDepth = getMaxDepth(value)

  function handleDepthChange(nextValue: string) {
    const parsed = Number.parseInt(nextValue, 10)

    if (Number.isNaN(parsed)) {
      setValue({
        ...(value ?? {}),
        maxDepth: MIN_DEPTH,
      })
      return
    }

    setValue({
      ...(value ?? {}),
      maxDepth: clamp(parsed, MIN_DEPTH, MAX_DEPTH),
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Navigation Depth</p>
        <p className="text-xs text-muted-foreground">
          Set how many levels this menu can nest. `1` keeps everything at the root,
          `2` allows children, and `3` allows grandchildren.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="navigation-menu-max-depth">
          Max depth
        </label>
        <Input
          id="navigation-menu-max-depth"
          type="number"
          min={MIN_DEPTH}
          max={MAX_DEPTH}
          step={1}
          value={String(maxDepth)}
          onChange={(event) => handleDepthChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Allowed range: {MIN_DEPTH} to {MAX_DEPTH}.
        </p>
      </div>
    </div>
  )
}

function getMaxDepth(value: Record<string, unknown> | null) {
  const candidate = value?.maxDepth

  if (typeof candidate !== "number" || Number.isNaN(candidate)) {
    return 2
  }

  return clamp(candidate, MIN_DEPTH, MAX_DEPTH)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
