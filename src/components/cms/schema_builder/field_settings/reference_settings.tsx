"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCollectionsForSchemaBuilder } from "@/actions/cms/collection-actions"

type ReferenceSettingsProps = {
  value: Record<string, unknown> | null
  setValue: (value: Record<string, unknown> | null) => void
  open?: boolean
  collectionId?: string | null
  setCollectionId?: (value: string | null) => void
  error?: string | null
  onCollectionTouched?: () => void
}

export function ReferenceSettings({
  open = false,
  collectionId,
  setCollectionId,
  error,
  onCollectionTouched,
}: ReferenceSettingsProps) {
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([])
  const [hasLoadedCollections, setHasLoadedCollections] = useState(false)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)

  const load_collections_once = useCallback(async () => {
    if (hasLoadedCollections || isLoadingCollections) {
      return
    }

    setIsLoadingCollections(true)
    setCollectionsError(null)
    try {
      const result = await getCollectionsForSchemaBuilder()
      if (!result.success || !result.data) {
        setCollectionsError(result.error ?? "Unable to load collections.")
        return
      }

      setCollections(result.data)
      setHasLoadedCollections(true)
    } finally {
      setIsLoadingCollections(false)
    }
  }, [hasLoadedCollections, isLoadingCollections])

  useEffect(() => {
    if (!open || hasLoadedCollections || isLoadingCollections) {
      return
    }

    void load_collections_once()
  }, [open, hasLoadedCollections, isLoadingCollections, load_collections_once])

  return (
    <Field>
      <FieldLabel>Collection *</FieldLabel>
      <Select
        value={collectionId ?? ""}
        onValueChange={(nextValue) => {
          setCollectionId?.(nextValue || null)
          onCollectionTouched?.()
        }}
        disabled={isLoadingCollections}
        onOpenChange={(isOpen) => {
          if (isOpen) return
          onCollectionTouched?.()
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              isLoadingCollections
                ? "Loading collections..."
                : collections.length === 0
                  ? "No collections available"
                  : "Select a collection"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {collections.map((collection) => (
            <SelectItem key={collection.id} value={collection.id}>
              {collection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoadingCollections ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading collections...</span>
        </div>
      ) : null}
      <FieldDescription>Pick a collection that this field should reference.</FieldDescription>
      {collectionsError ? <p className="text-xs text-rose-400">{collectionsError}</p> : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </Field>
  )
}
