"use client";

import { useMemo, useRef, useState, type RefCallback } from "react";
import {
  PointerSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createFieldFromType } from "./field-type-registry";
import type { BuilderField, BuilderFieldType, HeadlessFormDesignerProps } from "./types";

export function useFormDesignerController({ value, onChange }: HeadlessFormDesignerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(value[0]?.id ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "properties">("elements");
  const [autoFocusLabelFieldId, setAutoFocusLabelFieldId] = useState<string | null>(null);

  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor);
  const { setNodeRef: setCanvasNodeRef, isOver: isCanvasOver } = useDroppable({
    id: "canvas",
    data: { isCanvas: true },
  });
  const { setNodeRef: setCanvasShellNodeRef } = useDroppable({
    id: "canvas-shell",
    data: { isCanvas: true, isCanvasShell: true },
  });

  const collisionDetection: CollisionDetection = (args) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    let overId = getFirstCollision(intersections, "id");

    if (overId != null) {
      const overIdAsString = String(overId);
      if ((overIdAsString === "canvas" || overIdAsString === "canvas-shell") && value.length > 0) {
        const fieldIds = value.map((field) => `field:${field.id}`);
        const closestFieldId = getFirstCollision(
          closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter((container) =>
              fieldIds.includes(String(container.id)),
            ),
          }),
          "id",
        );

        if (closestFieldId != null) {
          overId = closestFieldId;
        }
      }
    }

    if (overId != null) {
      lastOverId.current = overId;
      return [{ id: overId }];
    }

    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  };

  const selectedField = useMemo(() => value.find((field) => field.id === selectedId) ?? null, [selectedId, value]);
  const activeField = useMemo(() => {
    if (!activeId?.startsWith("field:")) return null;
    const fieldId = activeId.replace("field:", "");
    return value.find((field) => field.id === fieldId) ?? null;
  }, [activeId, value]);
  const isPaletteDragging = Boolean(activeId?.startsWith("palette:"));

  const updateField = (id: string, patch: Partial<BuilderField>) => {
    onChange(value.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const removeField = (id: string) => {
    const next = value.filter((field) => field.id !== id);
    onChange(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? null);
    }
  };

  const setCanvasRefs: RefCallback<HTMLDivElement> = (node) => {
    canvasRef.current = node;
    setCanvasNodeRef(node);
  };

  const getDragCenter = (event: DragMoveEvent): { x: number; y: number } | null => {
    const translated = event.active.rect.current.translated;
    if (translated) {
      return {
        x: translated.left + translated.width / 2,
        y: translated.top + translated.height / 2,
      };
    }

    const initial = event.active.rect.current.initial;
    if (!initial) return null;

    return {
      x: initial.left + event.delta.x + initial.width / 2,
      y: initial.top + event.delta.y + initial.height / 2,
    };
  };

  const isPointInsideCanvas = (x: number, y: number) => {
    if (!canvasRef.current) return false;
    const bounds = canvasRef.current.getBoundingClientRect();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  };

  const getDropPreview = (y: number, activeFieldId?: string | null) => {
    const activeIndex = activeFieldId ? value.findIndex((field) => field.id === activeFieldId) : -1;
    const visibleFieldCount = activeIndex >= 0 ? value.length - 1 : value.length;

    let insertIndex = visibleFieldCount;
    let visibleIndex = 0;

    for (const field of value) {
      if (field.id === activeFieldId) {
        continue;
      }

      const fieldElement = document.querySelector(`[data-field-id="${field.id}"]`) as HTMLElement | null;
      if (!fieldElement) {
        visibleIndex += 1;
        continue;
      }

      const fieldRect = fieldElement.getBoundingClientRect();
      const fieldMidY = fieldRect.top + fieldRect.height / 2;
      if (y < fieldMidY) {
        insertIndex = visibleIndex;
        break;
      }

      visibleIndex += 1;
    }

    const renderIndex = activeIndex >= 0 && insertIndex > activeIndex ? insertIndex + 1 : insertIndex;

    return { insertIndex, renderIndex };
  };

  const clearDragState = () => {
    setActiveId(null);
    setIsDraggingCanvas(false);
    setDropIndicatorIndex(null);
    lastOverId.current = null;
  };

  const updateDragPreview = (x: number, y: number, activeFieldId?: string | null) => {
    if (!isPointInsideCanvas(x, y)) {
      setIsDraggingCanvas(false);
      setDropIndicatorIndex(null);
      return null;
    }

    const preview = getDropPreview(y, activeFieldId);
    setIsDraggingCanvas(true);
    setDropIndicatorIndex(preview.renderIndex);
    return preview;
  };

  const createInsertedFieldList = (insertIndex: number, field: BuilderField) => {
    const next = [...value];
    next.splice(Math.max(0, Math.min(insertIndex, next.length)), 0, field);
    return next;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setIsDraggingCanvas(false);
    setDropIndicatorIndex(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const point = getDragCenter(event);
    if (!point) return;
    const activeIdValue = String(event.active.id);
    const activeFieldId = activeIdValue.startsWith("field:") ? activeIdValue.replace("field:", "") : null;
    updateDragPreview(point.x, point.y, activeFieldId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeIdValue = String(event.active.id);
    const translated = event.active.rect.current.translated;
    if (!translated) {
      return;
    }

    const x = translated.left + translated.width / 2;
    const y = translated.top + translated.height / 2;
    const activeFieldId = activeIdValue.startsWith("field:") ? activeIdValue.replace("field:", "") : null;
    updateDragPreview(x, y, activeFieldId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIdValue = String(active.id);
    const activeSource = active.data.current?.source;
    const activeFieldType = active.data.current?.fieldType as BuilderFieldType | undefined;
    const translated = active.rect.current.translated;
    const x = translated ? translated.left + translated.width / 2 : null;
    const y = translated ? translated.top + translated.height / 2 : null;
    const activeFieldId = activeIdValue.startsWith("field:") ? activeIdValue.replace("field:", "") : null;
    const preview = x != null && y != null ? updateDragPreview(x, y, activeFieldId) : null;
    const insertIndex = preview?.insertIndex ?? dropIndicatorIndex ?? null;
    const droppedOnCanvas =
      insertIndex != null ||
      (over ? String(over.id) === "canvas" || String(over.id) === "canvas-shell" : false);

    if (activeSource === "palette" || activeIdValue.startsWith("palette:")) {
      if (!droppedOnCanvas) {
        clearDragState();
        return;
      }

      const type = activeFieldType ?? (activeIdValue.replace("palette:", "") as BuilderFieldType);
      const newField = createFieldFromType(type, value.length);
      onChange(createInsertedFieldList(insertIndex ?? value.length, newField));
      setSelectedId(newField.id);
      setSidebarTab("elements");
      setAutoFocusLabelFieldId(newField.id);
      clearDragState();
      return;
    }

    if (!activeFieldId || insertIndex == null) {
      clearDragState();
      return;
    }

    const oldIndex = value.findIndex((field) => field.id === activeFieldId);
    if (oldIndex < 0) {
      clearDragState();
      return;
    }

    const activeItem = value[oldIndex];
    const remainingFields = value.filter((field) => field.id !== activeFieldId);
    const targetIndex = Math.max(0, Math.min(insertIndex, remainingFields.length));
    const next = [...remainingFields];
    next.splice(targetIndex, 0, activeItem);

    const hasChanged = next.some((field, index) => field.id !== value[index]?.id);
    if (hasChanged) {
      onChange(next);
    }

    clearDragState();
  };

  const handleDragCancel = () => {
    clearDragState();
  };

  return {
    activeField,
    activeId,
    collisionDetection,
    dropIndicatorIndex,
    handleDragCancel,
    handleDragEnd,
    handleDragMove,
    handleDragOver,
    handleDragStart,
    isCanvasOver,
    isDraggingCanvas,
    isPaletteDragging,
    removeField,
    autoFocusLabelFieldId,
    selectedField,
    selectedId,
    sensors,
    setCanvasRefs,
    setCanvasShellNodeRef,
    setSelectedId,
    setSidebarTab,
    sidebarTab,
    setAutoFocusLabelFieldId,
    updateField,
  };
}
