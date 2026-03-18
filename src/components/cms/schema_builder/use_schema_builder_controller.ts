"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  PointerSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"

import type { ActionResponse } from "@/types/actions"
import type { Schema as CmsSchema } from "@/types/cms"
import type { SchemaSavePayload } from "@/types/schema_builder"
import { get_field_type_label } from "@/utils/schema/field_types"
import {
  clone_schema_document,
  map_schema_to_document,
  serialize_schema_document,
} from "@/utils/schema/schema_builder_mapper"
import type {
  FieldItem,
  NestedSectionItem,
  SchemaDocument,
  SchemaSection,
} from "@/utils/schema/schema_builder_types"
import {
  append_item_to_section,
  find_field_by_id,
  flatten_schema,
  get_blocked_container_ids,
  move_item_between_containers,
  move_item_within_container,
  move_section,
  remove_item_by_id,
  toggle_nested_section,
  update_field_by_id,
} from "@/utils/schema/schema_builder_utils"
import type { FieldSheetValues } from "./field_sheet"
import type { SchemaSettingsValues } from "./schema_settings_dialog"
import type { SectionDialogValues } from "./section_dialog"

type UseSchemaBuilderControllerProps = {
  initialDocument: SchemaDocument
  saveSchemaAction?: (payload: SchemaSavePayload) => Promise<ActionResponse<CmsSchema>>
}

export function useSchemaBuilderController({
  initialDocument,
  saveSchemaAction,
}: UseSchemaBuilderControllerProps) {
  const [schemaDocument, setSchemaDocument] = useState<SchemaDocument>(() =>
    clone_schema_document(initialDocument)
  )
  const [savedSchemaDocument, setSavedSchemaDocument] = useState<SchemaDocument>(() =>
    clone_schema_document(initialDocument)
  )
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<"item" | "section" | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialDocument.sections[0]?.id ?? ""
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaveTransition] = useTransition()
  const [isResetAnimating, setIsResetAnimating] = useState(false)
  const [fieldSheetState, setFieldSheetState] = useState<{
    open: boolean
    mode: "add" | "edit"
    targetSectionId: string | null
    editingFieldId: string | null
    values: FieldSheetValues
  }>({
    open: false,
    mode: "add",
    targetSectionId: null,
    editingFieldId: null,
    values: create_empty_field_values(),
  })
  const [sectionDialogState, setSectionDialogState] = useState<{
    open: boolean
    mode: "create" | "edit"
    editingSectionId: string | null
    values: SectionDialogValues
  }>({
    open: false,
    mode: "create",
    editingSectionId: null,
    values: create_empty_section_values(),
  })
  const [sectionDeleteState, setSectionDeleteState] = useState<{
    open: boolean
    sectionId: string | null
    sectionTitle: string
  }>({
    open: false,
    sectionId: null,
    sectionTitle: "",
  })
  const [schemaSettingsState, setSchemaSettingsState] = useState<{
    open: boolean
    values: SchemaSettingsValues
  }>({
    open: false,
    values: {
      title: initialDocument.title,
      description: initialDocument.description ?? "",
      isTemplate: initialDocument.isTemplate,
    },
  })

  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const recentlyMovedToNewContainer = useRef(false)
  const dragSnapshot = useRef<SchemaDocument | null>(null)
  const dragPointerOffsetY = useRef<number | null>(null)
  const resetAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetAnimationFrameRef = useRef<number | null>(null)

  const sections = schemaDocument.sections
  const sectionIds = sections.map((section) => section.id)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const { containers, items } = flatten_schema(sections)
  const activeItem =
    activeDragType === "item" && activeDragId ? items.get(activeDragId)?.item ?? null : null
  const activeSection =
    activeDragType === "section" && activeDragId
      ? sections.find((section) => section.id === activeDragId) ?? null
      : null
  const hasChanges =
    schemaDocument.title !== savedSchemaDocument.title ||
    (schemaDocument.description ?? "") !== (savedSchemaDocument.description ?? "") ||
    schemaDocument.isTemplate !== savedSchemaDocument.isTemplate ||
    JSON.stringify(schemaDocument.sections) !== JSON.stringify(savedSchemaDocument.sections)
  const isConnectedSchema = Boolean(saveSchemaAction)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false
    })

    return () => cancelAnimationFrame(frame)
  }, [sections])

  useEffect(() => {
    return () => {
      if (resetAnimationTimeoutRef.current) {
        clearTimeout(resetAnimationTimeoutRef.current)
      }

      if (resetAnimationFrameRef.current !== null) {
        cancelAnimationFrame(resetAnimationFrameRef.current)
      }
    }
  }, [])

  // Keep section dragging constrained to top-level sections and item dragging aware of nested containers.
  const collision_detection: CollisionDetection = (args) => {
    if (args.active.data.current?.type === "section") {
      const overId = getFirstCollision(
        closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            sectionIds.includes(String(container.id))
          ),
        }),
        "id"
      )

      return overId ? [{ id: overId }] : []
    }

    const pointerIntersections = pointerWithin(args)
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args)
    let overId = getFirstCollision(intersections, "id")

    if (overId != null) {
      const overIdAsString = String(overId)

      if (containers.has(overIdAsString)) {
        const containerItems = containers.get(overIdAsString)?.itemIds ?? []

        if (containerItems.length > 0) {
          const closestItem = getFirstCollision(
            closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((container) =>
                containerItems.includes(String(container.id))
              ),
            }),
            "id"
          )

          if (closestItem != null) {
            overId = closestItem
          }
        }
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }

    if (recentlyMovedToNewContainer.current) {
      lastOverId.current = args.active.id
    }

    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }

  // Snapshot state at drag start so cancel/drop-outside can restore safely.
  function handle_drag_start(event: DragStartEvent) {
    dragSnapshot.current = clone_schema_document(schemaDocument)
    const dragType = event.active.data.current?.type
    dragPointerOffsetY.current = dragType === "item" ? get_pointer_offset_y(event) : null
    setActiveDragId(String(event.active.id))
    setActiveDragType(dragType === "section" ? "section" : "item")
  }

  // Resolve the destination container/index based on pointer location and hovered item midpoint.
  function get_drag_target({
    activeRect,
    overId,
    overRect,
  }: {
    activeRect: DragEndEvent["active"]["rect"]["current"]["translated"]
    overId: string
    overRect: NonNullable<DragEndEvent["over"]>["rect"]
  }) {
    if (containers.has(overId)) {
      return {
        targetContainerId: overId,
        targetIndex: containers.get(overId)?.itemIds.length ?? 0,
      }
    }

    const overRecord = items.get(overId)
    if (!overRecord) {
      return null
    }

    const targetContainerId = overRecord.parentContainerId
    const destination = containers.get(targetContainerId)
    if (!destination) {
      return null
    }

    const overIndex = destination.itemIds.indexOf(overId)
    const pointerY =
      activeRect && dragPointerOffsetY.current !== null
        ? activeRect.top + dragPointerOffsetY.current
        : activeRect
          ? activeRect.top + activeRect.height / 2
          : null
    const overCenterY = overRect.top + overRect.height / 2
    const draggedBelowMidpoint = pointerY !== null && pointerY > overCenterY

    return {
      targetContainerId,
      targetIndex: overIndex + (draggedBelowMidpoint ? 1 : 0),
    }
  }

  // Live-move across containers while dragging so the user sees immediate structure updates.
  function handle_drag_over(event: DragOverEvent) {
    if (activeDragType !== "item") {
      return
    }

    const overId = event.over ? String(event.over.id) : null
    if (!overId) {
      return
    }

    const activeId = String(event.active.id)
    const activeRecord = items.get(activeId)
    if (!activeRecord || !event.over) {
      return
    }

    const sourceContainerId = activeRecord.parentContainerId
    const target = get_drag_target({
      activeRect: event.active.rect.current.translated,
      overId,
      overRect: event.over.rect,
    })

    if (!target) {
      return
    }

    // Keep same-container sorting live to avoid snap-like jumps on drop.
    if (sourceContainerId === target.targetContainerId) {
      const sourceContainer = containers.get(sourceContainerId)
      if (!sourceContainer) {
        return
      }

      const currentIndex = sourceContainer.itemIds.indexOf(activeId)
      const targetIndex = target.targetIndex
      if (currentIndex < 0 || currentIndex === targetIndex) {
        return
      }

      setSchemaDocument((currentDocument) => ({
        ...currentDocument,
        sections: move_item_within_container(
          currentDocument.sections,
          sourceContainerId,
          currentIndex,
          targetIndex
        ),
      }))
      return
    }

    const blockedContainers = get_blocked_container_ids(activeRecord.item)
    if (blockedContainers.has(target.targetContainerId)) {
      return
    }

    recentlyMovedToNewContainer.current = true

    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: move_item_between_containers(
        currentDocument.sections,
        activeId,
        sourceContainerId,
        target.targetContainerId,
        target.targetIndex
      ),
    }))
  }

  // Finalize ordering/moves at drop and clear drag bookkeeping state.
  function handle_drag_end(event: DragEndEvent) {
    setActiveDragId(null)
    setActiveDragType(null)
    lastOverId.current = null
    recentlyMovedToNewContainer.current = false

    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId) {
      if (dragSnapshot.current) {
        setSchemaDocument(dragSnapshot.current)
      }
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    if (event.active.data.current?.type === "section") {
      setSchemaDocument((currentDocument) => ({
        ...currentDocument,
        sections: move_section(currentDocument.sections, activeId, overId),
      }))
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    const activeRecord = items.get(activeId)
    if (!activeRecord) {
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    const sourceContainerId = activeRecord.parentContainerId
    const sourceContainer = containers.get(sourceContainerId)
    if (!sourceContainer) {
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    if (!event.over) {
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    const isSameContainerDrop =
      overId === sourceContainerId || items.get(overId)?.parentContainerId === sourceContainerId

    if (isSameContainerDrop) {
      const currentIndex = sourceContainer.itemIds.indexOf(activeId)
      const nextIndex =
        overId === sourceContainerId
          ? sourceContainer.itemIds.length - 1
          : sourceContainer.itemIds.indexOf(overId)

      if (currentIndex === nextIndex || nextIndex < 0) {
        dragSnapshot.current = null
        dragPointerOffsetY.current = null
        return
      }

      setSchemaDocument((currentDocument) => ({
        ...currentDocument,
        sections: move_item_within_container(
          currentDocument.sections,
          sourceContainerId,
          currentIndex,
          nextIndex
        ),
      }))

      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    const target = get_drag_target({
      activeRect: event.active.rect.current.translated,
      overId,
      overRect: event.over.rect,
    })

    if (!target) {
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    const { targetContainerId, targetIndex } = target

    const blockedContainers = get_blocked_container_ids(activeRecord.item)
    if (blockedContainers.has(targetContainerId)) {
      dragSnapshot.current = null
      dragPointerOffsetY.current = null
      return
    }

    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: move_item_between_containers(
        currentDocument.sections,
        activeId,
        sourceContainerId,
        targetContainerId,
        targetIndex
      ),
    }))
    dragSnapshot.current = null
    dragPointerOffsetY.current = null
  }

  // Restore pre-drag snapshot and clear transient drag state.
  function handle_drag_cancel() {
    if (dragSnapshot.current) {
      setSchemaDocument(dragSnapshot.current)
    }

    dragSnapshot.current = null
    dragPointerOffsetY.current = null
    lastOverId.current = null
    recentlyMovedToNewContainer.current = false
    setActiveDragId(null)
    setActiveDragType(null)
  }

  function handle_reset() {
    if (resetAnimationTimeoutRef.current) {
      clearTimeout(resetAnimationTimeoutRef.current)
    }

    if (resetAnimationFrameRef.current !== null) {
      cancelAnimationFrame(resetAnimationFrameRef.current)
    }

    const preResetPositions = capture_sortable_positions()

    setIsResetAnimating(true)
    setSchemaDocument(clone_schema_document(savedSchemaDocument))
    setActiveDragId(null)
    setActiveDragType(null)
    setSaveError(null)

    resetAnimationFrameRef.current = requestAnimationFrame(() => {
      resetAnimationFrameRef.current = requestAnimationFrame(() => {
        animate_sortable_positions(preResetPositions)
        resetAnimationFrameRef.current = null
      })
    })

    resetAnimationTimeoutRef.current = setTimeout(() => {
      setIsResetAnimating(false)
      resetAnimationTimeoutRef.current = null
    }, 320)
  }

  // Persist current ordering to the server and re-sync local state with canonical response data.
  function handle_save() {
    persist_schema_document(schemaDocument)
  }

  function handle_delete_section(sectionId: string) {
    const nextSections = sections.filter((section) => section.id !== sectionId)
    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: nextSections,
    }))

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(nextSections[0]?.id ?? "")
    }
  }

  function handle_open_create_section_dialog() {
    setSectionDialogState({
      open: true,
      mode: "create",
      editingSectionId: null,
      values: create_empty_section_values(),
    })
  }

  function handle_open_schema_settings_dialog() {
    setSchemaSettingsState({
      open: true,
      values: {
        title: schemaDocument.title,
        description: schemaDocument.description ?? "",
        isTemplate: schemaDocument.isTemplate,
      },
    })
  }

  function handle_close_schema_settings_dialog() {
    setSchemaSettingsState((current) => ({
      ...current,
      open: false,
    }))
  }

  function handle_submit_schema_settings_dialog(values: SchemaSettingsValues) {
    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      title: values.title,
      description: values.description || null,
      isTemplate: values.isTemplate,
    }))
    handle_close_schema_settings_dialog()
  }

  function handle_convert_schema_to_template() {
    if (schemaDocument.isTemplate) {
      return
    }

    const nextDocument: SchemaDocument = {
      ...schemaDocument,
      isTemplate: true,
    }

    setSchemaDocument(nextDocument)
    setSchemaSettingsState((current) => ({
      ...current,
      values: {
        ...current.values,
        isTemplate: true,
      },
    }))
    persist_schema_document(nextDocument)
  }

  function persist_schema_document(document: SchemaDocument) {
    if (!saveSchemaAction) {
      setSavedSchemaDocument(clone_schema_document(document))
      setSaveError(null)
      return
    }

    startSaveTransition(async () => {
      setSaveError(null)

      const response = await saveSchemaAction(serialize_schema_document(document))
      if (!response.success || !response.data) {
        setSaveError(response.error ?? "Unable to save the schema right now.")
        return
      }

      const nextDocument = clone_schema_document(map_schema_to_document(response.data))
      setSchemaDocument(nextDocument)
      setSavedSchemaDocument(clone_schema_document(nextDocument))
      setSchemaSettingsState((current) => ({
        ...current,
        values: {
          title: nextDocument.title,
          description: nextDocument.description ?? "",
          isTemplate: nextDocument.isTemplate,
        },
      }))
      setSelectedSectionId((currentSectionId) =>
        nextDocument.sections.some((section) => section.id === currentSectionId)
          ? currentSectionId
          : nextDocument.sections[0]?.id ?? ""
      )
    })
  }

  function handle_open_edit_section_dialog(sectionId: string) {
    const targetSection = sections.find((section) => section.id === sectionId)
    if (!targetSection) {
      return
    }

    setSectionDialogState({
      open: true,
      mode: "edit",
      editingSectionId: sectionId,
      values: {
        title: targetSection.title,
        description: targetSection.description ?? "",
      },
    })
  }

  function handle_close_section_dialog() {
    setSectionDialogState((current) => ({
      ...current,
      open: false,
    }))
  }

  function handle_submit_section_dialog(values: SectionDialogValues) {
    if (sectionDialogState.mode === "create") {
      const nextSection: SchemaSection = {
        id: create_item_id("section"),
        title: values.title,
        description: values.description,
        schemaId: schemaDocument.id,
        items: [],
      }

      setSchemaDocument((currentDocument) => ({
        ...currentDocument,
        sections: [...currentDocument.sections, nextSection],
      }))
      setSelectedSectionId(nextSection.id)
      handle_close_section_dialog()
      return
    }

    if (!sectionDialogState.editingSectionId) {
      return
    }

    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: currentDocument.sections.map((section) =>
        section.id === sectionDialogState.editingSectionId
          ? {
              ...section,
              title: values.title,
              description: values.description,
            }
          : section
      ),
    }))
    handle_close_section_dialog()
  }

  function handle_request_delete_section(sectionId: string) {
    const targetSection = sections.find((section) => section.id === sectionId)
    if (!targetSection) {
      return
    }

    setSectionDeleteState({
      open: true,
      sectionId,
      sectionTitle: targetSection.title,
    })
  }

  function handle_close_delete_section_dialog() {
    setSectionDeleteState((current) => ({
      ...current,
      open: false,
    }))
  }

  function handle_confirm_delete_section() {
    if (!sectionDeleteState.sectionId) {
      return
    }

    handle_delete_section(sectionDeleteState.sectionId)
    handle_close_delete_section_dialog()
  }

  function handle_toggle_nested_section(itemId: string) {
    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: toggle_nested_section(currentDocument.sections, itemId),
    }))
  }

  function handle_delete_field(fieldId: string) {
    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: remove_item_by_id(currentDocument.sections, fieldId),
    }))

    if (fieldSheetState.mode === "edit" && fieldSheetState.editingFieldId === fieldId) {
      handle_close_field_sheet()
    }
  }

  // Open the sheet in "add" mode for a specific section.
  function handle_open_add_field_sheet(sectionId: string) {
    setFieldSheetState({
      open: true,
      mode: "add",
      targetSectionId: sectionId,
      editingFieldId: null,
      values: create_empty_field_values(),
    })
  }

  // Open the sheet prefilled from an existing field in "edit" mode.
  function handle_open_edit_field_sheet(fieldId: string) {
    const field = find_field_by_id(sections, fieldId)
    if (!field) {
      return
    }

    setFieldSheetState({
      open: true,
      mode: "edit",
      targetSectionId: field.schemaSectionId,
      editingFieldId: field.id,
      values: {
        label: field.label,
        fieldKey: field.fieldKey,
        databaseType: field.databaseType,
        required: field.required,
        defaultValue: field.defaultValue ?? "",
        validation: field.validation ?? "",
        settings: field.settings ?? null,
        collectionId: field.collectionId ?? null,
      },
    })
  }

  function handle_close_field_sheet() {
    setFieldSheetState((current) => ({
      ...current,
      open: false,
    }))
  }

  // Apply add/edit form values to local schema state.
  function handle_submit_field_sheet(values: FieldSheetValues) {
    if (!values.databaseType) {
      return
    }

    if (fieldSheetState.mode === "add") {
      const targetSectionId = fieldSheetState.targetSectionId
      if (!targetSectionId) {
        return
      }

      const newItemId = create_item_id(values.databaseType)
      const normalizedFieldKey = values.fieldKey.trim() || to_field_key(values.label)
      const displayFieldType = get_field_type_label(values.databaseType)

      const newItem: FieldItem | NestedSectionItem =
        values.databaseType === "section"
          ? {
              id: newItemId,
              kind: "nested",
              label: values.label,
              databaseType: values.databaseType,
              fieldKey: normalizedFieldKey,
              required: values.required,
              settings: values.settings ?? null,
              validation: values.validation,
              defaultValue: values.defaultValue,
              collectionId: values.collectionId,
              schemaSectionId: targetSectionId,
              parentFieldId: null,
              open: true,
              items: [],
            }
          : {
              id: newItemId,
              kind: "field",
              label: values.label,
              databaseType: values.databaseType,
              fieldKey: normalizedFieldKey,
              fieldType: displayFieldType,
              required: values.required,
              settings: values.settings ?? null,
              validation: values.validation,
              defaultValue: values.defaultValue,
              collectionId: values.collectionId,
              schemaSectionId: targetSectionId,
              parentFieldId: null,
            }

      setSchemaDocument((currentDocument) => ({
        ...currentDocument,
        sections: append_item_to_section(currentDocument.sections, targetSectionId, newItem),
      }))
      handle_close_field_sheet()
      return
    }

    const editingFieldId = fieldSheetState.editingFieldId
    if (!editingFieldId) {
      return
    }

    const normalizedFieldKey = values.fieldKey.trim() || to_field_key(values.label)
    const displayFieldType = get_field_type_label(values.databaseType)

    setSchemaDocument((currentDocument) => ({
      ...currentDocument,
      sections: update_field_by_id(currentDocument.sections, editingFieldId, (field) => ({
        ...field,
        label: values.label,
        fieldKey: normalizedFieldKey,
        databaseType: values.databaseType,
        fieldType: displayFieldType,
        required: values.required,
        defaultValue: values.defaultValue,
        validation: values.validation,
        settings: values.settings ?? null,
        collectionId: values.collectionId,
      })),
    }))
    handle_close_field_sheet()
  }

  return {
    activeItem,
    activeSection,
    collision_detection,
    handle_close_delete_section_dialog,
    handle_close_section_dialog,
    handle_confirm_delete_section,
    handle_delete_section,
    handle_delete_field,
    handle_drag_cancel,
    handle_drag_end,
    handle_drag_over,
    handle_drag_start,
    handle_open_add_field_sheet,
    handle_open_create_section_dialog,
    handle_open_edit_section_dialog,
    handle_open_edit_field_sheet,
    handle_open_schema_settings_dialog,
    handle_request_delete_section,
    handle_reset,
    handle_save,
    handle_close_field_sheet,
    handle_submit_section_dialog,
    handle_submit_field_sheet,
    handle_submit_schema_settings_dialog,
    handle_convert_schema_to_template,
    handle_toggle_nested_section,
    hasChanges,
    isResetAnimating,
    fieldSheetMode: fieldSheetState.mode,
    fieldSheetOpen: fieldSheetState.open,
    fieldSheetValues: fieldSheetState.values,
    sectionDeleteOpen: sectionDeleteState.open,
    sectionDeleteTitle: sectionDeleteState.sectionTitle,
    sectionDialogMode: sectionDialogState.mode,
    sectionDialogOpen: sectionDialogState.open,
    sectionDialogValues: sectionDialogState.values,
    schemaSettingsOpen: schemaSettingsState.open,
    schemaSettingsValues: schemaSettingsState.values,
    isConnectedSchema,
    isSaving,
    saveError,
    schemaDocument,
    sectionIds,
    sections,
    selectedSectionId,
    sensors,
    setSelectedSectionId,
    handle_close_schema_settings_dialog,
  }
}

function get_pointer_offset_y(event: DragStartEvent) {
  const pointerY = get_event_client_y(event.activatorEvent)
  const initialTop = event.active.rect.current.initial?.top

  if (pointerY === null || initialTop === undefined) {
    return null
  }

  return pointerY - initialTop
}

function get_event_client_y(event: Event | null) {
  if (!event) {
    return null
  }

  const dragEvent = event as Event & {
    clientY?: number
    touches?: ArrayLike<{ clientY: number }>
    changedTouches?: ArrayLike<{ clientY: number }>
  }

  if (typeof dragEvent.clientY === "number") {
    return dragEvent.clientY
  }

  if ((dragEvent.touches?.length ?? 0) > 0) {
    return dragEvent.touches?.[0]?.clientY ?? null
  }

  if ((dragEvent.changedTouches?.length ?? 0) > 0) {
    return dragEvent.changedTouches?.[0]?.clientY ?? null
  }

  return null
}

function create_empty_field_values(): FieldSheetValues {
  return {
    label: "",
    fieldKey: "",
    databaseType: "",
    required: false,
    defaultValue: "",
    validation: "",
    settings: null,
    collectionId: null,
  }
}

function create_empty_section_values(): SectionDialogValues {
  return {
    title: "",
    description: "",
  }
}

function create_item_id(type: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return create_fallback_uuid(type)
}

function to_field_key(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function create_fallback_uuid(seed: string) {
  const normalizedSeed = seed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  const timeHex = Date.now().toString(16).padStart(12, "0").slice(-12)
  const randomHex = Math.random().toString(16).replace(".", "").padEnd(16, "0").slice(0, 16)
  const seedHex = normalizedSeed.padEnd(8, "0").slice(0, 8)

  return `${seedHex}-${randomHex.slice(0, 4)}-4${randomHex.slice(4, 7)}-a${randomHex.slice(
    7,
    10
  )}-${timeHex}`
}

function capture_sortable_positions() {
  const positions = new Map<string, DOMRect>()
  const elements = document.querySelectorAll<HTMLElement>("[data-schema-sortable-id]")

  for (const element of elements) {
    const id = element.dataset.schemaSortableId
    if (!id) {
      continue
    }

    positions.set(id, element.getBoundingClientRect())
  }

  return positions
}

function animate_sortable_positions(previousPositions: Map<string, DOMRect>) {
  const elements = document.querySelectorAll<HTMLElement>("[data-schema-sortable-id]")

  for (const element of elements) {
    const id = element.dataset.schemaSortableId
    if (!id) {
      continue
    }

    const previousRect = previousPositions.get(id)
    if (!previousRect) {
      continue
    }

    const nextRect = element.getBoundingClientRect()
    const deltaX = previousRect.left - nextRect.left
    const deltaY = previousRect.top - nextRect.top
    if (deltaX === 0 && deltaY === 0) {
      continue
    }

    element.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px)`,
        },
        {
          transform: "translate(0, 0)",
        },
      ],
      {
        duration: 320,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    )
  }
}
