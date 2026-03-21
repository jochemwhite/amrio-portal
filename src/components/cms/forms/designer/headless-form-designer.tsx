"use client";

import { useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FIELD_PALETTE, getFieldTypeDefinition } from "./field-type-registry";
import { DropIndicator } from "./dnd/drop-indicator";
import { PaletteItem } from "./dnd/palette-item";
import { SortableFieldCard } from "./dnd/sortable-field-card";
import { FieldPropertiesPanel } from "./properties/field-properties-panel";
import type { BuilderFieldType, HeadlessFormDesignerProps } from "./types";
import { useFormDesignerController } from "./use-form-designer-controller";

export function HeadlessFormDesigner({ value, onChange }: HeadlessFormDesignerProps) {
  const {
    activeId,
    collisionDetection,
    dropIndicatorIndex,
    handleDragCancel,
    handleDragEnd,
    handleDragMove,
    handleDragOver,
    handleDragStart,
    isDraggingCanvas,
    isPaletteDragging,
    removeField,
    selectedField,
    selectedId,
    sensors,
    setAutoFocusLabelFieldId,
    setCanvasRefs,
    setCanvasShellNodeRef,
    setSelectedId,
    setSidebarTab,
    sidebarTab,
    updateField,
    autoFocusLabelFieldId,
  } = useFormDesignerController({ value, onChange });
  const showDropIndicators = isPaletteDragging;
  const isReorderingField = Boolean(activeId?.startsWith("field:"));
  const paletteFieldType = activeId?.startsWith("palette:")
    ? (activeId.replace("palette:", "") as BuilderFieldType)
    : null;
  const paletteDefinition = paletteFieldType
    ? getFieldTypeDefinition(paletteFieldType)
    : null;
  const PaletteIcon = paletteDefinition?.icon;

  useEffect(() => {
    if (!isReorderingField) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "grabbing";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [isReorderingField]);

  useEffect(() => {
    if (!autoFocusLabelFieldId) return;
    const timeoutId = setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `[data-field-label-input="${autoFocusLabelFieldId}"]`,
      );

      input?.focus();
      input?.select();
      setAutoFocusLabelFieldId(null);
    }, 40);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoFocusLabelFieldId, setAutoFocusLabelFieldId]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
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
                isDraggingCanvas && "border-primary/70 ring-2 ring-primary/30",
              )}
            >
              {value.length === 0 ? (
                showDropIndicators ? (
                  <div className="flex min-h-[62vh] items-center">
                    <DropIndicator active />
                  </div>
                ) : (
                  <div className="flex min-h-[62vh] items-center justify-center text-center text-muted-foreground">
                    <div>
                      <AlignLeft className="mx-auto mb-3 h-5 w-5" />
                      <p className="text-sm">Drop fields here</p>
                    </div>
                  </div>
                )
              ) : (
                <SortableContext items={value.map((field) => `field:${field.id}`)} strategy={rectSortingStrategy}>
                  <div className="space-y-2">
                    {showDropIndicators ? <DropIndicator active={dropIndicatorIndex === 0} /> : null}
                    {value.map((field, index) => (
                      <div key={field.id}>
                        <SortableFieldCard
                          field={field}
                          isSelected={selectedId === field.id}
                          isOver={false}
                          onSelect={() => {
                            setSelectedId(field.id);
                            setSidebarTab("properties");
                          }}
                          onLableChange={(nextLabel) => {
                            setSelectedId(field.id);
                            setSidebarTab("properties");
                            updateField(field.id, { label: nextLabel });
                          }}
                        />
                        {showDropIndicators ? <DropIndicator active={dropIndicatorIndex === index + 1} /> : null}
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
                  {FIELD_PALETTE.map((item) => (
                    <PaletteItem key={item.type} type={item.type} label={item.label} icon={item.icon} />
                  ))}
                </div>
              </>
            ) : (
              <FieldPropertiesPanel
                selectedField={selectedField}
                onUpdateField={updateField}
                onRemoveField={removeField}
              />
            )}
          </div>
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {isPaletteDragging && paletteDefinition && PaletteIcon ? (
          <div className="w-64 cursor-grabbing rounded-md border border-primary/40 bg-card px-3 py-3 text-sm shadow-xl ring-1 ring-primary/20">
            <div className="flex items-center gap-2 text-foreground">
              <PaletteIcon className="h-4 w-4 text-primary" />
              <p className="font-medium">{paletteDefinition.label}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Release to add field</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
