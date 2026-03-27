import type { NavItem } from "./nav-builder.types"

export function getItemDepth(items: NavItem[], id: string, depth = 0): number {
  for (const item of items) {
    if (item.id === id) {
      return depth
    }

    if (item.children?.length) {
      const childDepth = getItemDepth(item.children, id, depth + 1)
      if (childDepth !== -1) {
        return childDepth
      }
    }
  }

  return -1
}

export function getDescendantDepth(item: NavItem): number {
  if (!item.children?.length) {
    return 0
  }

  return 1 + Math.max(...item.children.map((child) => getDescendantDepth(child)))
}

export function wouldExceedDepth(
  items: NavItem[],
  draggedId: string,
  targetParentId: string | null,
  maxDepth: number
): boolean {
  const draggedItem = findItem(items, draggedId)
  if (!draggedItem) {
    return false
  }

  const descendantDepth = getDescendantDepth(draggedItem)
  const targetDepth = targetParentId === null ? -1 : getItemDepth(items, targetParentId)

  if (targetDepth === -1 && targetParentId !== null) {
    return false
  }

  return targetDepth + 1 + descendantDepth > maxDepth - 1
}

function findItem(items: NavItem[], id: string): NavItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item
    }

    if (item.children?.length) {
      const child = findItem(item.children, id)
      if (child) {
        return child
      }
    }
  }

  return null
}
