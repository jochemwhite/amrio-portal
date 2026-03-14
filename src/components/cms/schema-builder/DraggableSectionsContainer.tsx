"use client";

import { useRef, useState, useCallback } from "react";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { GripVertical } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useSchemaBuilderStore } from "@/stores/schema-editor-store";
import type { SchemaField, SchemaSection } from "@/types/cms";
import {
  getFieldIcon,
  getFieldTypeColor,
  getFieldTypeLabel,
} from "../field-types";
import { Section } from "./Section";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DraggedItem =
  | { type: "section"; data: SchemaSection }
  | { type: "field"; data: SchemaField }
  | null;

type FieldDragSnapshot = {
  fieldId: string;
  fromSectionId: string;
  fromIndex: number;
};

type SectionDragSnapshot = {
  sectionId: string;
  fromIndex: number;
};

// ---------------------------------------------------------------------------
// Pure helpers — no store access, easy to test
// ---------------------------------------------------------------------------

function findFieldLocation(
  fieldId: string,
  sections: SchemaSection[],
): { sectionId: string; index: number } | null {
  for (const section of sections) {
    const index = (section.cms_schema_fields ?? []).findIndex(
      (f) => f.id === fieldId,
    );
    if (index !== -1) return { sectionId: section.id, index };
  }
  return null;
}

function findSectionIndex(sectionId: string, sections: SchemaSection[]): number {
  return sections.findIndex((s) => s.id === sectionId);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DraggableSectionsContainer = () => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);

  // Refs for drag lifecycle — never cause re-renders
  const lastPreviewKeyRef = useRef<string | null>(null);
  const fieldSnapshotRef = useRef<FieldDragSnapshot | null>(null);
  const sectionSnapshotRef = useRef<SectionDragSnapshot | null>(null);

  const {
    sections,
    selectedSectionId,
    isSaving,
    setSelectedSection,
    openEditSectionDialog,
    deleteSectionById,
    openEditFieldDialog,
    deleteFieldById,
  } = useSchemaBuilderStore(
    useShallow((state) => ({
      sections: state.sections,
      selectedSectionId: state.selectedSectionId,
      isSaving: state.isSaving,
      setSelectedSection: state.setSelectedSection,
      openEditSectionDialog: state.openEditSectionDialog,
      deleteSectionById: state.deleteSectionById,
      openEditFieldDialog: state.openEditFieldDialog,
      deleteFieldById: state.deleteFieldById,
    })),
  );

  // Store actions accessed imperatively — avoids re-render on every drag event
  const moveFieldPreview = useSchemaBuilderStore((s) => s.moveFieldPreview);
  const reorderSectionsByIndex = useSchemaBuilderStore((s) => s.reorderSectionsByIndex);
  const finalizeFieldDrag = useSchemaBuilderStore((s) => s.finalizeFieldDrag);

  // -------------------------------------------------------------------------
  // Drag start — record snapshot and set overlay item
  // -------------------------------------------------------------------------

  const handleDragStart = useCallback(
    (event: any) => {
      const id = event.operation?.source?.id;
      if (typeof id !== "string") return;

      // Always read latest sections imperatively — not from closure
      const { sections: latestSections } = useSchemaBuilderStore.getState();

      fieldSnapshotRef.current = null;
      sectionSnapshotRef.current = null;
      lastPreviewKeyRef.current = null;

      const section = latestSections.find((s) => s.id === id);
      if (section) {
        const fromIndex = findSectionIndex(id, latestSections);
        if (fromIndex !== -1) {
          sectionSnapshotRef.current = { sectionId: id, fromIndex };
        }
        setDraggedItem({ type: "section", data: section });
        return;
      }

      const field = latestSections
        .flatMap((s) => s.cms_schema_fields ?? [])
        .find((f) => f.id === id);

      if (field) {
        const location = findFieldLocation(id, latestSections);
        if (location) {
          fieldSnapshotRef.current = {
            fieldId: id,
            fromSectionId: location.sectionId,
            fromIndex: location.index,
          };
        }
        setDraggedItem({ type: "field", data: field });
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Drag over — live preview, heavily de-duplicated via ref
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback(
    (event: any) => {
      const source = event.operation?.source;
      const target = event.operation?.target;

      if (!source || !target) return;

      // Only handle field drags — sections reorder on drop
      if (!fieldSnapshotRef.current) return;

      const sourceId = source.id as string;
      const toSectionId = String(target.group ?? target.id);
      const toIndex: number = target.index ?? 0;

      // Read current location imperatively to avoid stale closure
      const { sections: latestSections } = useSchemaBuilderStore.getState();
      const currentLocation = findFieldLocation(sourceId, latestSections);
      if (!currentLocation) return;

      const { sectionId: fromSectionId, index: fromIndex } = currentLocation;

      if (fromIndex < 0 || toIndex < 0) return;

      const previewKey = `${sourceId}:${fromSectionId}:${toSectionId}:${fromIndex}:${toIndex}`;
      if (lastPreviewKeyRef.current === previewKey) return;
      lastPreviewKeyRef.current = previewKey;

      moveFieldPreview({ fieldId: sourceId, fromSectionId, toSectionId, fromIndex, toIndex });
    },
    [moveFieldPreview],
  );

  // -------------------------------------------------------------------------
  // Drag end — commit result directly, no extra render tick needed
  // -------------------------------------------------------------------------

  const handleDragEnd = useCallback(() => {
    lastPreviewKeyRef.current = null;

    const { sections: latestSections } = useSchemaBuilderStore.getState();

    if (fieldSnapshotRef.current) {
      const initial = fieldSnapshotRef.current;
      const current = findFieldLocation(initial.fieldId, latestSections);

      if (
        current &&
        (current.sectionId !== initial.fromSectionId ||
          current.index !== initial.fromIndex)
      ) {
        finalizeFieldDrag({
          fieldId: initial.fieldId,
          fromSectionId: initial.fromSectionId,
          toSectionId: current.sectionId,
          fromIndex: initial.fromIndex,
          toIndex: current.index,
        });
      }
    } else if (sectionSnapshotRef.current) {
      const initial = sectionSnapshotRef.current;
      const currentIndex = findSectionIndex(initial.sectionId, latestSections);

      if (currentIndex !== -1 && currentIndex !== initial.fromIndex) {
        reorderSectionsByIndex(initial.fromIndex, currentIndex);
      }
    }

    fieldSnapshotRef.current = null;
    sectionSnapshotRef.current = null;

    // Clear overlay in the same tick — no deferred state needed
    setDraggedItem(null);
  }, [finalizeFieldDrag, reorderSectionsByIndex]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {sections.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p>No sections found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Section
              key={section.id}
              section={section}
              index={index}
              isSelected={selectedSectionId === section.id}
              isSaving={isSaving}
              activeDragId={draggedItem?.type === "section" ? (draggedItem.data.id ?? null) : draggedItem?.type === "field" ? (draggedItem.data.id ?? null) : null}
              onSelect={(id: string) => setSelectedSection(id)}
              onEdit={() => openEditSectionDialog(section)}
              onDelete={() => deleteSectionById(section.id)}
              onEditField={openEditFieldDialog}
              onDeleteField={deleteFieldById}
            />
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {draggedItem?.type === "section" && (
          <div className="pointer-events-none w-full rotate-1 cursor-grabbing rounded-lg border bg-card shadow-xl">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium">
                    {draggedItem.data.name}
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                    {draggedItem.data.cms_schema_fields?.length || 0}{" "}
                    {(draggedItem.data.cms_schema_fields?.length || 0) === 1
                      ? "field"
                      : "fields"}
                  </span>
                </div>
              </div>

              {draggedItem.data.description && (
                <p className="mt-1 ml-7 text-sm text-gray-500">
                  {draggedItem.data.description}
                </p>
              )}
            </div>
          </div>
        )}

        {draggedItem?.type === "field" && (
          <div className="pointer-events-none cursor-grabbing rounded-lg border bg-card shadow-lg">
            <div className="flex items-center space-x-3 p-3">
              <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
              <div
                className={`rounded-lg p-2 ${getFieldTypeColor(draggedItem.data.type)}`}
              >
                {getFieldIcon(draggedItem.data.type)}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {draggedItem.data.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getFieldTypeLabel(draggedItem.data.type)}
                </div>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
};