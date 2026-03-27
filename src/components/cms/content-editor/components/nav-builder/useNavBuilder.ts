"use client"

/**
 * DND audit findings:
 * - NavBuilderDialog.tsx used DndContext with only closestCenter, no keyboard sensor,
 *   no Always measuring strategy, and overlay previews were derived from ad-hoc drag
 *   state instead of the active DND id.
 * - NavCanvas.tsx registered root sorting with raw item ids and split the root
 *   droppable area into custom :empty/:end ids, which made root drop handling
 *   inconsistent and harder to parse.
 * - NavItemRoot.tsx used raw sortable ids, applied sortable attributes/listeners to
 *   the handle together, and only mounted the child SortableContext when children
 *   already existed or the panel was visible, so first-time nesting had no stable
 *   droppable target.
 * - NavItemNested.tsx repeated the same raw-id and conditional-child-context issues
 *   as the root item, which made nested reorder targets ambiguous and caused child
 *   zones to disappear during drag.
 * - PageSidebar.tsx used page:* draggable ids outside the requested convention and
 *   allowed pages already in the nav to be dragged again, creating duplicates.
 * - useNavBuilder.ts mixed id parsing with data.current payload parsing, computed
 *   drop intent from multiple custom data shapes, and relied on non-standard root/
 *   child zone ids instead of one parseable convention across all drag sources.
 */

import { useEffect, useMemo, useState } from "react"
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"

import { NavIds, type ParsedNavId } from "./nav-builder.ids"
import { getItemDepth, wouldExceedDepth } from "./useDepthGuard"
import type {
  CmsPage,
  DropState,
  NavBuilderProps,
  NavItem,
  NavItemDraft,
  NavMenu,
} from "./nav-builder.types"

type SavedSnapshot = {
  menuId: string
  name: string
  items: NavItem[]
  updatedAt: string
}

type ItemLocation = {
  item: NavItem
  parentId: string | null
  index: number
  depth: number
}

type RemovedItem = {
  item: NavItem
  parentId: string | null
  index: number
}

type CustomLinkDraft = {
  label: string
  href: string
}

type InitialBuilderState = {
  menuId: string
  menuName: string
  items: NavItem[]
  savedSnapshot: SavedSnapshot
}

type UseNavBuilderOptions = Pick<
  NavBuilderProps,
  "availablePages" | "initialMenu" | "maxDepth" | "onSave" | "tenantId"
>

const DEFAULT_MENU_NAME = "Untitled Navigation"

export function useNavBuilder({
  availablePages = [],
  initialMenu,
  maxDepth = 2,
  onSave,
  tenantId,
}: UseNavBuilderOptions) {
  const hasInitialMenu = Boolean(initialMenu)
  const initialMenuResetKey = JSON.stringify({
    id: initialMenu?.id ?? null,
    name: initialMenu?.name ?? DEFAULT_MENU_NAME,
    updatedAt: initialMenu?.updatedAt ?? null,
    items: initialMenu?.items ?? [],
  })
  const normalizedInitialMenu = useMemo<NavMenu | undefined>(() => {
    if (!hasInitialMenu) {
      return undefined
    }

    const parsed = JSON.parse(initialMenuResetKey) as {
      id: string | null
      items: NavItem[]
      name: string
      updatedAt: string | null
    }

    return {
      id: parsed.id ?? crypto.randomUUID(),
      name: parsed.name,
      tenantId,
      items: parsed.items,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  }, [hasInitialMenu, initialMenuResetKey, tenantId])
  const [initialState] = useState(() => createInitialBuilderState(normalizedInitialMenu))
  const [menuId, setMenuId] = useState(initialState.menuId)
  const [menuName, setMenuName] = useState(initialState.menuName)
  const [items, setItems] = useState<NavItem[]>(initialState.items)
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot>(initialState.savedSnapshot)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [editingId, setEditingIdState] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<NavItemDraft | null>(null)
  const [pageSearch, setPageSearch] = useState("")
  const [isCustomLinkFormOpen, setIsCustomLinkFormOpen] = useState(false)
  const [customLinkDraft, setCustomLinkDraft] = useState<CustomLinkDraft>({
    label: "",
    href: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const nextState = createInitialBuilderState(normalizedInitialMenu)

    setMenuId(nextState.menuId)
    setMenuName(nextState.menuName)
    setItems(nextState.items)
    setSavedSnapshot(nextState.savedSnapshot)
    clearTransientState()
  }, [normalizedInitialMenu, tenantId])

  const isDirty =
    JSON.stringify({ name: menuName, items }) !==
    JSON.stringify({ name: savedSnapshot.name, items: savedSnapshot.items })
  const dropState: DropState = {
    overId,
  }
  const activeParsed = activeId ? NavIds.parse(activeId) : { type: "UNKNOWN" as const }
  const activePage = activeParsed.type === "PAGE" ? getPageById(activeParsed.pageId) : null
  const activeItem =
    activeParsed.type === "ROOT_ITEM" || activeParsed.type === "CHILD_ITEM"
      ? getItemById(activeParsed.itemId)
      : null

  function clearTransientState() {
    setActiveId(null)
    setOverId(null)
    setEditingIdState(null)
    setEditingDraft(null)
    setPageSearch("")
    setIsCustomLinkFormOpen(false)
    setCustomLinkDraft({
      label: "",
      href: "",
    })
  }

  function resetMenu() {
    setMenuId(savedSnapshot.menuId)
    setMenuName(savedSnapshot.name)
    setItems(cloneItems(savedSnapshot.items))
    clearTransientState()
  }

  function getPageById(pageId: string) {
    return availablePages.find((page) => page.id === pageId) ?? null
  }

  function getItemById(id: string) {
    return findItemLocation(items, id)?.item ?? null
  }

  function getNestedItemById(parentId: string, id: string) {
    const location = findItemLocation(items, id)

    if (!location || location.parentId !== parentId) {
      return null
    }

    return location.item
  }

  function setEditingId(id: string | null) {
    if (!id) {
      setEditingIdState(null)
      setEditingDraft(null)
      return
    }

    const location = findItemLocation(items, id)
    if (!location) {
      setEditingIdState(null)
      setEditingDraft(null)
      return
    }

    setEditingIdState(id)
    setEditingDraft({
      label: location.item.label,
      href: location.item.href,
      target: location.item.target,
      icon: location.item.icon,
    })
  }

  function updateEditingDraft(patch: Partial<NavItemDraft>) {
    setEditingDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        ...patch,
      }
    })
  }

  function saveEditingItem() {
    if (!editingId || !editingDraft) {
      return
    }

    updateItem(editingId, {
      label: editingDraft.label.trim() || "Untitled item",
      href: editingDraft.href.trim() || "/",
      target: editingDraft.target,
      icon: editingDraft.icon?.trim() || undefined,
    })
    setEditingId(null)
  }

  function cancelEditing() {
    setEditingId(null)
  }

  function updateItem(id: string, patch: Partial<NavItem>) {
    setItems((currentItems) => updateItemInTree(currentItems, id, patch))
  }

  function removeItem(id: string) {
    setItems((currentItems) => removeItemFromTree(currentItems, id))

    if (editingId === id) {
      setEditingId(null)
    }
  }

  function addBlankRootItem() {
    const item = createBlankItem()

    setItems((currentItems) => addItemAtRoot(currentItems, item))
    setEditingIdState(item.id)
    setEditingDraft({
      label: item.label,
      href: item.href,
      target: item.target,
      icon: item.icon,
    })
  }

  function openCustomLinkForm() {
    setIsCustomLinkFormOpen(true)
  }

  function closeCustomLinkForm() {
    setIsCustomLinkFormOpen(false)
    setCustomLinkDraft({
      label: "",
      href: "",
    })
  }

  function updateCustomLinkDraft(patch: Partial<CustomLinkDraft>) {
    setCustomLinkDraft((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }))
  }

  function addCustomLink() {
    const label = customLinkDraft.label.trim()
    const href = customLinkDraft.href.trim()

    if (!label || !href) {
      toast.error("Enter both a label and URL for the custom link")
      return
    }

    setItems((currentItems) =>
      addItemAtRoot(currentItems, {
        id: crypto.randomUUID(),
        label,
        href,
        target: href.startsWith("http") ? "_blank" : "_self",
      })
    )
    closeCustomLinkForm()
  }

  function getActivePageIds(pages: CmsPage[] = availablePages) {
    const hrefs = new Set(flattenItems(items).map((item) => normalizeHref(item.href)))

    return pages
      .filter((page) => hrefs.has(normalizeHref(page.slug)))
      .map((page) => page.id)
  }

  function shouldShowChildZone(parentId: string) {
    const parentLocation = findItemLocation(items, parentId)
    if (!parentLocation || !canNestAtDepth(parentLocation.depth)) {
      return false
    }

    if (parentLocation.item.children?.length) {
      return true
    }

    if (!activeId || !overId) {
      return false
    }

    const parsedOverId = NavIds.parse(overId)
    if (parsedOverId.type === "CHILD_ZONE") {
      return parsedOverId.parentId === parentId
    }

    if (parsedOverId.type === "ROOT_ITEM" || parsedOverId.type === "CHILD_ITEM") {
      return parsedOverId.itemId === parentId
    }

    return false
  }

  function isItemAtMaxDepth(itemId: string) {
    return getItemDepth(items, itemId) >= maxDepth - 1
  }

  function canNestAtDepth(depth: number) {
    return depth < maxDepth - 1
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      setOverId(null)
      return
    }

    setOverId(String(event.over.id))
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const nextActiveId = String(event.active.id)
    const nextOverId = event.over ? String(event.over.id) : null

    setOverId(null)
    setActiveId(null)

    if (!nextOverId || nextActiveId === nextOverId) {
      return
    }

    const activeData = NavIds.parse(nextActiveId)
    const overData = NavIds.parse(nextOverId)

    if (activeData.type === "UNKNOWN" || overData.type === "UNKNOWN") {
      return
    }

    if (isInvalidDropTarget(items, activeData, overData)) {
      return
    }

    if (activeData.type === "PAGE") {
      const page = getPageById(activeData.pageId)
      if (!page) {
        return
      }

      if (overData.type === "ROOT_ZONE") {
        setItems((currentItems) => addItemAtRoot(currentItems, createItemFromPage(page)))
        return
      }

      if (overData.type === "ROOT_ITEM") {
        setItems((currentItems) =>
          insertRootAt(currentItems, createItemFromPage(page), overData.itemId)
        )
        return
      }

      if (overData.type === "CHILD_ZONE") {
        if (wouldExceedNewItemDepth(items, overData.parentId, maxDepth)) {
          toast.error(`Maximum nesting depth of ${maxDepth} reached`)
          return
        }

        setItems((currentItems) =>
          addItemAsChild(currentItems, overData.parentId, createItemFromPage(page))
        )
        return
      }

      if (overData.type === "CHILD_ITEM") {
        if (wouldExceedNewItemDepth(items, overData.parentId, maxDepth)) {
          toast.error(`Maximum nesting depth of ${maxDepth} reached`)
          return
        }

        setItems((currentItems) =>
          addItemAsChildAt(
            currentItems,
            overData.parentId,
            createItemFromPage(page),
            overData.itemId
          )
        )
      }

      return
    }

    if (activeData.type === "ROOT_ITEM") {
      if (overData.type === "ROOT_ITEM") {
        setItems((currentItems) => reorderRoot(currentItems, activeData.itemId, overData.itemId))
        return
      }

      if (overData.type === "ROOT_ZONE") {
        setItems((currentItems) => moveRootToEnd(currentItems, activeData.itemId))
        return
      }

      if (overData.type === "CHILD_ZONE") {
        if (wouldExceedDepth(items, activeData.itemId, overData.parentId, maxDepth)) {
          toast.error(`Maximum nesting depth of ${maxDepth} reached`)
          return
        }

        setItems((currentItems) => demoteToChild(currentItems, activeData.itemId, overData.parentId))
        return
      }

      if (overData.type === "CHILD_ITEM") {
        if (wouldExceedDepth(items, activeData.itemId, overData.parentId, maxDepth)) {
          toast.error(`Maximum nesting depth of ${maxDepth} reached`)
          return
        }

        setItems((currentItems) =>
          demoteToChildAt(currentItems, activeData.itemId, overData.parentId, overData.itemId)
        )
      }

      return
    }

    if (activeData.type !== "CHILD_ITEM") {
      return
    }

    if (overData.type === "ROOT_ZONE") {
      setItems((currentItems) => promoteToRoot(currentItems, activeData.itemId, activeData.parentId))
      return
    }

    if (overData.type === "ROOT_ITEM") {
      setItems((currentItems) =>
        promoteToRootAt(currentItems, activeData.itemId, activeData.parentId, overData.itemId)
      )
      return
    }

    if (overData.type === "CHILD_ZONE") {
      if (wouldExceedDepth(items, activeData.itemId, overData.parentId, maxDepth)) {
        toast.error(`Maximum nesting depth of ${maxDepth} reached`)
        return
      }

      setItems((currentItems) =>
        moveChildToParent(currentItems, activeData.itemId, activeData.parentId, overData.parentId)
      )
      return
    }

    if (overData.type !== "CHILD_ITEM") {
      return
    }

    if (wouldExceedDepth(items, activeData.itemId, overData.parentId, maxDepth)) {
      toast.error(`Maximum nesting depth of ${maxDepth} reached`)
      return
    }

    setItems((currentItems) =>
      reorderChild(
        currentItems,
        activeData.itemId,
        activeData.parentId,
        overData.itemId,
        overData.parentId
      )
    )
  }

  async function saveMenu() {
    const nextUpdatedAt = new Date().toISOString()
    const nextMenu = buildMenu({
      items,
      menuId,
      menuName,
      tenantId,
      updatedAt: nextUpdatedAt,
    })
    const previousSnapshot = savedSnapshot

    setIsSaving(true)
    setSavedSnapshot({
      menuId: nextMenu.id,
      name: nextMenu.name,
      items: cloneItems(nextMenu.items),
      updatedAt: nextMenu.updatedAt,
    })

    try {
      await onSave(nextMenu)
      toast.success("Navigation menu saved")
      return true
    } catch (error) {
      setSavedSnapshot(previousSnapshot)
      toast.error(getErrorMessage(error, "Unable to save navigation menu"))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  function getMenuJSON(): NavMenu {
    return buildMenu({
      items,
      menuId,
      menuName,
      tenantId,
      updatedAt: savedSnapshot.updatedAt,
    })
  }

  return {
    activeId,
    activeItem,
    activePage,
    addBlankRootItem,
    addCustomLink,
    cancelEditing,
    canNestAtDepth,
    closeCustomLinkForm,
    customLinkDraft,
    dropState,
    editingDraft,
    editingId,
    getActivePageIds,
    getItemById,
    getMenuJSON,
    getNestedItemById,
    getPageById,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    isCustomLinkFormOpen,
    isDirty,
    isItemAtMaxDepth,
    isSaving,
    items,
    lastSavedAt: savedSnapshot.updatedAt,
    maxDepth,
    menuName,
    openCustomLinkForm,
    overId,
    pageSearch,
    removeItem,
    resetMenu,
    saveEditingItem,
    saveMenu,
    setEditingId,
    setMenuName,
    setPageSearch,
    shouldShowChildZone,
    updateCustomLinkDraft,
    updateEditingDraft,
    updateItem,
  }
}

export type UseNavBuilderReturn = ReturnType<typeof useNavBuilder>

function createInitialBuilderState(initialMenu?: NavMenu): InitialBuilderState {
  const menuId = initialMenu?.id ?? crypto.randomUUID()
  const menuName = initialMenu?.name ?? DEFAULT_MENU_NAME
  const nextItems = sanitizeItems(initialMenu?.items ?? [])
  const updatedAt = initialMenu?.updatedAt ?? new Date().toISOString()

  return {
    menuId,
    menuName,
    items: cloneItems(nextItems),
    savedSnapshot: {
      menuId,
      name: menuName,
      items: cloneItems(nextItems),
      updatedAt,
    },
  }
}

function buildMenu({
  items,
  menuId,
  menuName,
  tenantId,
  updatedAt,
}: {
  items: NavItem[]
  menuId: string
  menuName: string
  tenantId: string
  updatedAt: string
}): NavMenu {
  return {
    id: menuId,
    name: menuName.trim() || DEFAULT_MENU_NAME,
    tenantId,
    items: sanitizeItems(items),
    updatedAt,
  }
}

function createBlankItem(): NavItem {
  return {
    id: crypto.randomUUID(),
    label: "New item",
    href: "/",
    target: "_self",
  }
}

function createItemFromPage(page: CmsPage): NavItem {
  return {
    id: crypto.randomUUID(),
    label: page.title,
    href: normalizeHref(page.slug),
    target: "_self",
  }
}

function cloneItems(items: NavItem[]) {
  return structuredClone(items) as NavItem[]
}

function sanitizeItems(items: NavItem[]) {
  return items.map((item) => sanitizeItem(item))
}

function sanitizeItem(item: NavItem): NavItem {
  const nextItem: NavItem = {
    id: item.id,
    label: item.label,
    href: item.href,
    target: item.target,
  }

  if (item.icon) {
    nextItem.icon = item.icon
  }

  if (item.children?.length) {
    nextItem.children = item.children.map((child) => sanitizeItem(child))
  }

  return nextItem
}

function flattenItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children ?? [])])
}

function normalizeHref(href: string) {
  if (!href) {
    return "/"
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href
  }

  const normalized = href.replace(/^\/+/, "")
  return normalized ? `/${normalized}` : "/"
}

function findItemLocation(
  items: NavItem[],
  id: string,
  parentId: string | null = null,
  depth = 0
): ItemLocation | null {
  for (const [index, item] of items.entries()) {
    if (item.id === id) {
      return {
        item,
        parentId,
        index,
        depth,
      }
    }

    if (!item.children?.length) {
      continue
    }

    const childLocation = findItemLocation(item.children, id, item.id, depth + 1)
    if (childLocation) {
      return childLocation
    }
  }

  return null
}

function findItemMutable(items: NavItem[], id: string): NavItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item
    }

    if (!item.children?.length) {
      continue
    }

    const child = findItemMutable(item.children, id)
    if (child) {
      return child
    }
  }

  return null
}

function removeItemMutable(
  items: NavItem[],
  id: string,
  parentId: string | null = null
): RemovedItem | null {
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) {
    const [item] = items.splice(index, 1)

    return {
      item,
      parentId,
      index,
    }
  }

  for (const item of items) {
    if (!item.children?.length) {
      continue
    }

    const removed = removeItemMutable(item.children, id, item.id)
    if (removed) {
      return removed
    }
  }

  return null
}

function insertChildMutable(
  items: NavItem[],
  parentId: string,
  item: NavItem,
  index?: number
) {
  const parent = findItemMutable(items, parentId)
  if (!parent) {
    return false
  }

  const children = parent.children ?? []
  const nextIndex = clamp(index ?? children.length, 0, children.length)

  children.splice(nextIndex, 0, item)
  parent.children = children
  return true
}

function updateItemInTree(items: NavItem[], id: string, patch: Partial<NavItem>) {
  const next = cloneItems(items)
  const item = findItemMutable(next, id)

  if (!item) {
    return items
  }

  Object.assign(item, patch)
  return sanitizeItems(next)
}

function removeItemFromTree(items: NavItem[], id: string) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, id)

  if (!removed) {
    return items
  }

  return sanitizeItems(next)
}

function addItemAtRoot(items: NavItem[], item: NavItem) {
  const next = cloneItems(items)

  next.push(sanitizeItem(item))
  return sanitizeItems(next)
}

function insertRootAt(items: NavItem[], item: NavItem, overId: string) {
  const next = cloneItems(items)
  const overIndex = next.findIndex((currentItem) => currentItem.id === overId)

  next.splice(overIndex === -1 ? next.length : overIndex, 0, sanitizeItem(item))
  return sanitizeItems(next)
}

function addItemAsChild(items: NavItem[], parentId: string, item: NavItem) {
  const next = cloneItems(items)
  const didInsert = insertChildMutable(next, parentId, sanitizeItem(item))

  return didInsert ? sanitizeItems(next) : items
}

function addItemAsChildAt(
  items: NavItem[],
  parentId: string,
  item: NavItem,
  overChildId: string
) {
  const next = cloneItems(items)
  const parent = findItemMutable(next, parentId)

  if (!parent) {
    return items
  }

  const children = parent.children ?? []
  const overIndex = children.findIndex((child) => child.id === overChildId)

  children.splice(overIndex === -1 ? children.length : overIndex, 0, sanitizeItem(item))
  parent.children = children
  return sanitizeItems(next)
}

function reorderRoot(items: NavItem[], activeId: string, overId: string) {
  const oldIndex = items.findIndex((item) => item.id === activeId)
  const newIndex = items.findIndex((item) => item.id === overId)

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items
  }

  return sanitizeItems(arrayMove(cloneItems(items), oldIndex, newIndex))
}

function moveRootToEnd(items: NavItem[], itemId: string) {
  const oldIndex = items.findIndex((item) => item.id === itemId)

  if (oldIndex === -1 || oldIndex === items.length - 1) {
    return items
  }

  return sanitizeItems(arrayMove(cloneItems(items), oldIndex, items.length - 1))
}

function demoteToChild(items: NavItem[], itemId: string, targetParentId: string) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, itemId)

  if (!removed || removed.parentId !== null) {
    return items
  }

  const didInsert = insertChildMutable(next, targetParentId, removed.item)
  return didInsert ? sanitizeItems(next) : items
}

function demoteToChildAt(
  items: NavItem[],
  itemId: string,
  targetParentId: string,
  overChildId: string
) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, itemId)

  if (!removed || removed.parentId !== null) {
    return items
  }

  const parent = findItemMutable(next, targetParentId)
  if (!parent) {
    return items
  }

  const children = parent.children ?? []
  const overIndex = children.findIndex((child) => child.id === overChildId)

  children.splice(overIndex === -1 ? children.length : overIndex, 0, removed.item)
  parent.children = children
  return sanitizeItems(next)
}

function promoteToRoot(items: NavItem[], itemId: string, parentId: string) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, itemId)

  if (!removed || removed.parentId !== parentId) {
    return items
  }

  next.push(removed.item)
  return sanitizeItems(next)
}

function promoteToRootAt(items: NavItem[], itemId: string, parentId: string, overRootId: string) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, itemId)

  if (!removed || removed.parentId !== parentId) {
    return items
  }

  const overIndex = next.findIndex((item) => item.id === overRootId)
  next.splice(overIndex === -1 ? next.length : overIndex, 0, removed.item)
  return sanitizeItems(next)
}

function moveChildToParent(
  items: NavItem[],
  itemId: string,
  fromParentId: string,
  toParentId: string
) {
  const next = cloneItems(items)
  const removed = removeItemMutable(next, itemId)

  if (!removed || removed.parentId !== fromParentId) {
    return items
  }

  const didInsert = insertChildMutable(next, toParentId, removed.item)
  return didInsert ? sanitizeItems(next) : items
}

function reorderChild(
  items: NavItem[],
  activeId: string,
  activeParentId: string,
  overId: string,
  overParentId: string
) {
  const next = cloneItems(items)

  if (activeParentId === overParentId) {
    const parent = findItemMutable(next, activeParentId)
    const children = parent?.children ?? []
    const oldIndex = children.findIndex((child) => child.id === activeId)
    const newIndex = children.findIndex((child) => child.id === overId)

    if (!parent || oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return items
    }

    parent.children = arrayMove(children, oldIndex, newIndex)
    return sanitizeItems(next)
  }

  const removed = removeItemMutable(next, activeId)
  if (!removed || removed.parentId !== activeParentId) {
    return items
  }

  const parent = findItemMutable(next, overParentId)
  if (!parent) {
    return items
  }

  const children = parent.children ?? []
  const overIndex = children.findIndex((child) => child.id === overId)

  children.splice(overIndex === -1 ? children.length : overIndex, 0, removed.item)
  parent.children = children
  return sanitizeItems(next)
}

function containsDescendant(item: NavItem, id: string): boolean {
  if (!item.children?.length) {
    return false
  }

  return item.children.some((child) => child.id === id || containsDescendant(child, id))
}

function wouldExceedNewItemDepth(items: NavItem[], targetParentId: string, maxDepth: number) {
  return getItemDepth(items, targetParentId) + 1 > maxDepth - 1
}

function isInvalidDropTarget(
  items: NavItem[],
  activeData: ParsedNavId,
  overData: ParsedNavId
) {
  if (activeData.type !== "ROOT_ITEM" && activeData.type !== "CHILD_ITEM") {
    return false
  }

  const activeItem = findItemLocation(items, activeData.itemId)?.item
  if (!activeItem) {
    return false
  }

  if ((overData.type === "ROOT_ITEM" || overData.type === "CHILD_ITEM") && overData.itemId === activeData.itemId) {
    return true
  }

  if (overData.type === "CHILD_ZONE") {
    return overData.parentId === activeData.itemId || containsDescendant(activeItem, overData.parentId)
  }

  if (overData.type === "ROOT_ITEM" || overData.type === "CHILD_ITEM") {
    return containsDescendant(activeItem, overData.itemId)
  }

  return false
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
