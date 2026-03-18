'use client'
import { arrayMove } from "@dnd-kit/sortable"

import type {
  ContainerRecord,
  FieldItem,
  ItemRecord,
  SchemaItem,
  SchemaSection,
} from "./schema_builder_types"

export function flatten_schema(sections: SchemaSection[]) {
  const containers = new Map<string, ContainerRecord>()
  const items = new Map<string, ItemRecord>()

  function visit_container(
    containerId: string,
    title: string,
    containerItems: SchemaItem[],
    depth: number,
    kind: ContainerRecord["kind"]
  ) {
    containers.set(containerId, {
      id: containerId,
      depth,
      title,
      kind,
      itemIds: containerItems.map((item) => item.id),
    })

    for (const item of containerItems) {
      items.set(item.id, {
        item,
        parentContainerId: containerId,
      })

      if (item.kind === "nested") {
        visit_container(get_nested_container_id(item.id), item.label, item.items, depth + 1, "nested")
      }
    }
  }

  for (const section of sections) {
    visit_container(get_section_container_id(section.id), section.title, section.items, 0, "section")
  }

  return { containers, items }
}

export function move_item_within_container(
  sections: SchemaSection[],
  containerId: string,
  currentIndex: number,
  nextIndex: number
): SchemaSection[] {
  return update_container_items(sections, containerId, (containerItems) =>
    arrayMove(containerItems, currentIndex, nextIndex)
  )
}

export function move_section(
  sections: SchemaSection[],
  activeSectionId: string,
  overSectionId: string
): SchemaSection[] {
  const currentIndex = sections.findIndex((section) => section.id === activeSectionId)
  const nextIndex = sections.findIndex((section) => section.id === overSectionId)

  if (currentIndex < 0 || nextIndex < 0 || currentIndex === nextIndex) {
    return sections
  }

  return arrayMove(sections, currentIndex, nextIndex)
}

export function move_item_between_containers(
  sections: SchemaSection[],
  itemId: string,
  sourceContainerId: string,
  targetContainerId: string,
  targetIndex: number
): SchemaSection[] {
  let movedItem: SchemaItem | null = null

  const withoutMovedItem = update_container_items(sections, sourceContainerId, (containerItems) => {
    const nextItems = [...containerItems]
    const sourceIndex = nextItems.findIndex((item) => item.id === itemId)

    if (sourceIndex < 0) {
      return containerItems
    }

    ;[movedItem] = nextItems.splice(sourceIndex, 1)
    return nextItems
  })

  if (!movedItem) {
    return sections
  }

  const resolvedItem = movedItem

  return update_container_items(withoutMovedItem, targetContainerId, (containerItems) => {
    const nextItems = [...containerItems]
    const boundedIndex = Math.max(0, Math.min(targetIndex, nextItems.length))
    nextItems.splice(boundedIndex, 0, resolvedItem)
    return nextItems
  })
}

export function update_container_items(
  sections: SchemaSection[],
  containerId: string,
  updater: (items: SchemaItem[]) => SchemaItem[]
): SchemaSection[] {
  return sections.map((section) => {
    if (get_section_container_id(section.id) === containerId) {
      return {
        ...section,
        items: updater(section.items),
      }
    }

    return {
      ...section,
      items: update_nested_container_items(section.items, containerId, updater),
    }
  })
}

function update_nested_container_items(
  items: SchemaItem[],
  containerId: string,
  updater: (items: SchemaItem[]) => SchemaItem[]
): SchemaItem[] {
  return items.map((item) => {
    if (item.kind !== "nested") {
      return item
    }

    if (get_nested_container_id(item.id) === containerId) {
      return {
        ...item,
        items: updater(item.items),
      }
    }

    return {
      ...item,
      items: update_nested_container_items(item.items, containerId, updater),
    }
  })
}

export function toggle_nested_section(
  sections: SchemaSection[],
  nestedSectionId: string
): SchemaSection[] {
  return sections.map((section) => ({
    ...section,
    items: toggle_nested_items(section.items, nestedSectionId),
  }))
}

function toggle_nested_items(items: SchemaItem[], nestedSectionId: string): SchemaItem[] {
  return items.map((item) => {
    if (item.kind !== "nested") {
      return item
    }

    if (item.id === nestedSectionId) {
      return {
        ...item,
        open: !item.open,
      }
    }

    return {
      ...item,
      items: toggle_nested_items(item.items, nestedSectionId),
    }
  })
}

export function get_blocked_container_ids(item: SchemaItem): Set<string> {
  const blocked = new Set<string>()

  if (item.kind !== "nested") {
    return blocked
  }

  blocked.add(get_nested_container_id(item.id))

  for (const child of item.items) {
    const nestedBlocked = get_blocked_container_ids(child)
    for (const containerId of nestedBlocked) {
      blocked.add(containerId)
    }
  }

  return blocked
}

export function clone_schema(sections: SchemaSection[]): SchemaSection[] {
  return sections.map((section) => ({
    ...section,
    items: clone_items(section.items),
  }))
}

function clone_items(items: SchemaItem[]): SchemaItem[] {
  return items.map((item) => {
    if (item.kind === "field") {
      return { ...item }
    }

    return {
      ...item,
      items: clone_items(item.items),
    }
  })
}

export function count_items_deep(items: SchemaItem[]): number {
  return items.reduce((total, item) => {
    if (item.kind === "field") {
      return total + 1
    }

    return total + 1 + count_items_deep(item.items)
  }, 0)
}

export function get_section_container_id(sectionId: string) {
  return `container:${sectionId}`
}

export function get_nested_container_id(itemId: string) {
  return `container:${itemId}`
}

export function append_item_to_section(
  sections: SchemaSection[],
  sectionId: string,
  item: SchemaItem
): SchemaSection[] {
  return sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          items: [...section.items, item],
        }
      : section
  )
}

export function find_field_by_id(sections: SchemaSection[], fieldId: string): FieldItem | null {
  for (const section of sections) {
    const match = find_field_in_items(section.items, fieldId)
    if (match) {
      return match
    }
  }

  return null
}

function find_field_in_items(items: SchemaItem[], fieldId: string): FieldItem | null {
  for (const item of items) {
    if (item.kind === "field" && item.id === fieldId) {
      return item
    }

    if (item.kind === "nested") {
      const nestedMatch = find_field_in_items(item.items, fieldId)
      if (nestedMatch) {
        return nestedMatch
      }
    }
  }

  return null
}

export function update_field_by_id(
  sections: SchemaSection[],
  fieldId: string,
  updater: (field: FieldItem) => FieldItem
): SchemaSection[] {
  return sections.map((section) => ({
    ...section,
    items: update_field_in_items(section.items, fieldId, updater),
  }))
}

function update_field_in_items(
  items: SchemaItem[],
  fieldId: string,
  updater: (field: FieldItem) => FieldItem
): SchemaItem[] {
  return items.map((item) => {
    if (item.kind === "field") {
      return item.id === fieldId ? updater(item) : item
    }

    return {
      ...item,
      items: update_field_in_items(item.items, fieldId, updater),
    }
  })
}

export function remove_item_by_id(sections: SchemaSection[], itemId: string): SchemaSection[] {
  return sections.map((section) => ({
    ...section,
    items: remove_item_in_items(section.items, itemId),
  }))
}

function remove_item_in_items(items: SchemaItem[], itemId: string): SchemaItem[] {
  const nextItems: SchemaItem[] = []

  for (const item of items) {
    if (item.id === itemId) {
      continue
    }

    if (item.kind === "nested") {
      nextItems.push({
        ...item,
        items: remove_item_in_items(item.items, itemId),
      })
      continue
    }

    nextItems.push(item)
  }

  return nextItems
}
