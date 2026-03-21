"use client";

import { useMemo, useRef, useState } from "react";
import {
  closestCenter,
  getFirstCollision,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type UniqueIdentifier,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RefCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlignLeft, Calendar, CheckSquare, ChevronsUpDown, GripVertical, Hash, Mail, Pilcrow, Type } from "lucide-react";

export type BuilderFieldType = "text" | "email" | "textarea" | "number" | "checkbox" | "select" | "date";

export interface BuilderField {
  id: string;
  type: BuilderFieldType;
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

interface HeadlessFormDesignerProps {
  value: BuilderField[];
  onChange: (value: BuilderField[]) => void;
}

const palette: Array<{ type: BuilderFieldType; label: string; icon: React.ElementType }> = [
  { type: "text", label: "Text Field", icon: Type },
  { type: "email", label: "Email Field", icon: Mail },
  { type: "textarea", label: "TextArea Field", icon: Pilcrow },
  { type: "number", label: "Number Field", icon: Hash },
  { type: "checkbox", label: "CheckBox Field", icon: CheckSquare },
  { type: "select", label: "Select Field", icon: ChevronsUpDown },
  { type: "date", label: "Date Field", icon: Calendar },
];

function createField(type: BuilderFieldType, index: number): BuilderField {
  const baseLabel = `${type[0].toUpperCase()}${type.slice(1)} field`;
  return {
    id: crypto.randomUUID(),
    type,
    key: `${type}_${index + 1}`,
    label: baseLabel,
    required: false,
    placeholder: type === "checkbox" ? undefined : "Value here...",
    helpText: "Helper text",
    options: type === "select" ? ["Option 1", "Option 2"] : undefined,
  };
}

function PaletteItem({ type, label, icon: Icon }: { type: BuilderFieldType; label: string; icon: React.ElementType }) {
  const id = `palette:${type}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      source: "palette",
      fieldType: type,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        "w-full cursor-grab touch-none rounded-md border border-border bg-card px-3 py-4 text-left transition hover:border-primary/40 hover:bg-muted/50 active:cursor-grabbing",
        isDragging && "opacity-60",
      )}
      {...attributes}
      {...listeners}
    >
      <Icon className="mb-2 h-4 w-4 text-foreground/80" />
      <p className="text-sm font-semibold text-foreground">{label}</p>
    </button>
  );
}

function SortableFieldCard({
  field,
  isSelected,
  isOver,
  onSelect,
}: {
  field: BuilderField;
  isSelected: boolean;
  isOver: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `field:${field.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      data-field-id={field.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={cn(
        "relative cursor-grab touch-none rounded-md border border-border bg-card px-3 py-4 transition active:cursor-grabbing",
        isSelected && "ring-2 ring-primary/70",
        isOver && "border-primary/70 bg-primary/5",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="absolute right-2 top-2 rounded p-1 text-foreground/50 hover:bg-muted hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <p className="pr-8 text-sm font-semibold text-foreground">
        {field.label}
        {field.required ? "*" : ""}
      </p>

      {field.type === "textarea" ? (
        <Textarea value={field.placeholder ?? ""} readOnly className="mt-2 min-h-20 border-border bg-background text-muted-foreground" />
      ) : field.type === "checkbox" ? (
        <label className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={false} readOnly />
          {field.label}
        </label>
      ) : field.type === "select" ? (
        <Input value={field.placeholder ?? "Select..."} readOnly className="mt-2 border-border bg-background text-muted-foreground" />
      ) : (
        <Input value={field.placeholder ?? "Value here..."} readOnly className="mt-2 border-border bg-background text-muted-foreground" />
      )}

      {field.helpText ? <p className="mt-2 text-xs text-muted-foreground">{field.helpText}</p> : null}
    </div>
  );
}

function DropIndicator({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out",
        active ? "mb-2 max-h-16 opacity-100" : "mb-0 max-h-0 opacity-0",
      )}
    >
      <div className="rounded-md border border-dashed border-primary/60 bg-primary/10 px-3 py-4 text-xs text-primary">
        Drop here
      </div>
    </div>
  );
}

export function HeadlessFormDesigner({ value, onChange }: HeadlessFormDesignerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(value[0]?.id ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "properties">("elements");
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

  const collision_detection: CollisionDetection = (args) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    let overId = getFirstCollision(intersections, "id");

    // Match schema-builder behavior: when we collide with the container,
    // resolve to the closest field item inside that container.
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
      const newField = createField(type, value.length);
      onChange(createInsertedFieldList(insertIndex ?? value.length, newField));
      setSelectedId(newField.id);
      setSidebarTab("properties");
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

    const activeField = value[oldIndex];
    const remainingFields = value.filter((field) => field.id !== activeFieldId);
    const targetIndex = Math.max(0, Math.min(insertIndex, remainingFields.length));
    const next = [...remainingFields];
    next.splice(targetIndex, 0, activeField);

    const hasChanged = next.some((field, index) => field.id !== value[index]?.id);
    if (hasChanged) {
      onChange(next);
    }

    clearDragState();
  };

  const handleDragCancel = () => {
    clearDragState();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision_detection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid min-h-[78vh] grid-cols-1 overflow-hidden rounded-xl border border-border bg-background lg:grid-cols-[1fr_320px]">
        <div className="relative" ref={setCanvasShellNodeRef}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(120,120,120,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.12) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          <div className="relative mx-auto h-full max-w-4xl p-4 lg:p-8">
            <div
              ref={setCanvasRefs}
              className={cn(
                "min-h-[70vh] rounded-xl border border-border bg-card/80 p-4",
                (isCanvasOver || isDraggingCanvas) && "border-primary/70 ring-2 ring-primary/30",
              )}
            >
              {value.length === 0 ? (
                <div
                  className={cn(
                    "flex min-h-[62vh] items-center justify-center text-center text-muted-foreground transition",
                    isPaletteDragging && "rounded-md border border-dashed border-primary/60 bg-primary/10",
                  )}
                >
                  <div>
                    <AlignLeft className="mx-auto mb-3 h-5 w-5" />
                    <p className="text-sm">{isPaletteDragging ? "Release to add field" : "Drop fields here"}</p>
                  </div>
                </div>
              ) : (
                <SortableContext items={value.map((field) => `field:${field.id}`)} strategy={rectSortingStrategy}>
                  <div className="space-y-2">
                    <DropIndicator active={dropIndicatorIndex === 0} />
                    {value.map((field, index) => (
                      <div key={field.id} className="transition-transform duration-200 ease-out">
                        <SortableFieldCard
                          field={field}
                          isSelected={selectedId === field.id}
                          isOver={false}
                          onSelect={() => {
                            setSelectedId(field.id);
                            setSidebarTab("properties");
                          }}
                        />
                        <DropIndicator active={dropIndicatorIndex === index + 1} />
                      </div>
                    ))}
                </div>
              </SortableContext>
            )}
            </div>
          </div>
        </div>

        <aside className="border-l border-border bg-card">
          <div className="flex items-center border-b border-border p-2">
            <Button
              type="button"
              variant={sidebarTab === "elements" ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => setSidebarTab("elements")}
            >
              Elements
            </Button>
            <Button
              type="button"
              variant={sidebarTab === "properties" ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => setSidebarTab("properties")}
            >
              Properties
            </Button>
          </div>

          <div className="h-[calc(78vh-48px)] overflow-y-auto p-3">
            {sidebarTab === "elements" ? (
              <>
                <p className="mb-3 text-xs font-medium text-muted-foreground">Drag and drop elements</p>
                <div className="grid grid-cols-2 gap-2">
                  {palette.map((item) => (
                    <PaletteItem key={item.type} type={item.type} label={item.label} icon={item.icon} />
                  ))}
                </div>
              </>
            ) : !selectedField ? (
              <p className="text-sm text-muted-foreground">Select a field in the canvas to edit its properties.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input value={selectedField.label} onChange={(event) => updateField(selectedField.id, { label: event.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Key</label>
                  <Input value={selectedField.key} onChange={(event) => updateField(selectedField.id, { key: event.target.value })} />
                </div>

                {selectedField.type !== "checkbox" && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Placeholder</label>
                    <Input
                      value={selectedField.placeholder ?? ""}
                      onChange={(event) => updateField(selectedField.id, { placeholder: event.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Help text</label>
                  <Input
                    value={selectedField.helpText ?? ""}
                    onChange={(event) => updateField(selectedField.id, { helpText: event.target.value })}
                  />
                </div>

                {selectedField.type === "select" && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Options (one per line)</label>
                    <Textarea
                      rows={6}
                      value={(selectedField.options ?? []).join("\n")}
                      onChange={(event) =>
                        updateField(selectedField.id, {
                          options: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(event) => updateField(selectedField.id, { required: event.target.checked })}
                  />
                  Required field
                </label>

                <Button type="button" variant="destructive" className="w-full" onClick={() => removeField(selectedField.id)}>
                  Remove Field
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <DragOverlay>
        {activeField ? (
          <div className="w-72 rounded-md border border-border bg-card px-3 py-3 text-sm shadow-xl">
            <p className="font-medium">{activeField.label}</p>
            <p className="text-xs text-muted-foreground">{activeField.type}</p>
          </div>
        ) : activeId ? (
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow">
            Dragging
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
