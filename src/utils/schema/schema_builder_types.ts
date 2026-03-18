"use client"

import type { useSortable } from "@dnd-kit/sortable"

export type FieldType = string

type SchemaItemBase = {
  id: string
  label: string
  databaseType: string
  fieldKey: string
  required: boolean
  settings?: Record<string, unknown> | null
  validation?: string | null
  defaultValue?: string | null
  collectionId?: string | null
  schemaSectionId: string
  parentFieldId?: string | null
}

export type FieldItem = SchemaItemBase & {
  kind: "field"
  fieldType: FieldType
}

export type NestedSectionItem = SchemaItemBase & {
  kind: "nested"
  open: boolean
  items: SchemaItem[]
}

export type SchemaItem = FieldItem | NestedSectionItem

export type SchemaSection = {
  id: string
  title: string
  description?: string | null
  schemaId?: string | null
  items: SchemaItem[]
}

export type SchemaDocument = {
  id: string
  title: string
  description?: string | null
  isTemplate: boolean
  schemaType: string
  sections: SchemaSection[]
}

export type ContainerRecord = {
  id: string
  depth: number
  title: string
  itemIds: string[]
  kind: "section" | "nested"
}

export type ItemRecord = {
  item: SchemaItem
  parentContainerId: string
}

export type DragHandleProps = {
  attributes?: ReturnType<typeof useSortable>["attributes"]
  listeners?: ReturnType<typeof useSortable>["listeners"]
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"] | undefined
}
