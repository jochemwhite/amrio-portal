"use client"

import { DndContext, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import type { ActionResponse } from "@/types/actions"
import type { Schema as CmsSchema } from "@/types/cms"
import type { SchemaSavePayload } from "@/types/schema_builder"
import type { SchemaDocument } from "@/utils/schema/schema_builder_types"

import { DragPreview, SectionCard, SectionDragPreview } from "./dnd"
import { FieldSheet } from "./field_sheet"
import { SchemaBuilderHeader } from "./schema_builder_header"
import { SchemaSettingsDialog } from "./schema_settings_dialog"
import { SchemaBuilderToolbar } from "./schema_builder_toolbar"
import { ConfirmSectionDeleteDialog, SectionDialog } from "./section_dialog"
import { useSchemaBuilderController } from "./use_schema_builder_controller"

type SchemaBuilderProps = {
  initialDocument: SchemaDocument
  saveSchemaAction?: (payload: SchemaSavePayload) => Promise<ActionResponse<CmsSchema>>
}

export function SchemaBuilder({ initialDocument, saveSchemaAction }: SchemaBuilderProps) {
  const controller = useSchemaBuilderController({
    initialDocument,
    saveSchemaAction,
  })

  return (
    <main className="min-h-screen  px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <SchemaBuilderHeader
          description={controller.schemaDocument.description}
          onOpenSettings={controller.handle_open_schema_settings_dialog}
          title={controller.schemaDocument.title}
        />
        <SchemaBuilderToolbar
          canAddSection
          hasChanges={controller.hasChanges}
          isSaving={controller.isSaving}
          onAddSection={controller.handle_open_create_section_dialog}
          onReset={controller.handle_reset}
          onSave={controller.handle_save}
        />
        {controller.saveError ? <p className="text-sm text-rose-400">{controller.saveError}</p> : null}

        <DndContext
          sensors={controller.sensors}
          collisionDetection={controller.collision_detection}
          onDragStart={controller.handle_drag_start}
          onDragOver={controller.handle_drag_over}
          onDragEnd={controller.handle_drag_end}
          onDragCancel={controller.handle_drag_cancel}
        >
          <SortableContext items={controller.sectionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {controller.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  canAddField
                  canDelete
                  isSelected={section.id === controller.selectedSectionId}
                  isResetAnimating={controller.isResetAnimating}
                  onAddField={controller.handle_open_add_field_sheet}
                  onDelete={controller.handle_request_delete_section}
                  onDeleteField={controller.handle_delete_field}
                  onEdit={controller.handle_open_edit_section_dialog}
                  onEditField={controller.handle_open_edit_field_sheet}
                  onSelect={controller.setSelectedSectionId}
                  onToggleNestedSection={controller.handle_toggle_nested_section}
                  section={section}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {controller.activeItem ? <DragPreview item={controller.activeItem} /> : null}
            {controller.activeSection ? <SectionDragPreview section={controller.activeSection} /> : null}
          </DragOverlay>
        </DndContext>

        <FieldSheet
          key={`${controller.fieldSheetMode}-${controller.fieldSheetOpen}-${controller.fieldSheetValues.databaseType}-${controller.fieldSheetValues.fieldKey}-${controller.fieldSheetValues.label}`}
          mode={controller.fieldSheetMode}
          open={controller.fieldSheetOpen}
          initialValues={controller.fieldSheetValues}
          onClose={controller.handle_close_field_sheet}
          onSubmit={controller.handle_submit_field_sheet}
        />

        <SectionDialog
          key={`${controller.sectionDialogMode}-${controller.sectionDialogOpen}-${controller.sectionDialogValues.title}`}
          mode={controller.sectionDialogMode}
          open={controller.sectionDialogOpen}
          initialValues={controller.sectionDialogValues}
          onClose={controller.handle_close_section_dialog}
          onSubmit={controller.handle_submit_section_dialog}
        />

        <ConfirmSectionDeleteDialog
          open={controller.sectionDeleteOpen}
          sectionTitle={controller.sectionDeleteTitle}
          onCancel={controller.handle_close_delete_section_dialog}
          onConfirm={controller.handle_confirm_delete_section}
        />

        <SchemaSettingsDialog
          key={`${controller.schemaSettingsOpen}-${controller.schemaSettingsValues.title}-${controller.schemaSettingsValues.isTemplate}`}
          isSaving={controller.isSaving}
          open={controller.schemaSettingsOpen}
          initialValues={controller.schemaSettingsValues}
          onClose={controller.handle_close_schema_settings_dialog}
          onConvertToTemplate={controller.handle_convert_schema_to_template}
          onSubmit={controller.handle_submit_schema_settings_dialog}
        />
      </div>
    </main>
  )
}
