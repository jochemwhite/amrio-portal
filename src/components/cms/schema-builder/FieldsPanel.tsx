import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Layers } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableField } from './DraggableField';
import { NestedPayloadField } from './NestedPayloadField';

interface FieldsPanelProps {
  selectedSection: any | null;
  isSaving: boolean;
  onEdit: (field: any) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  reorderSectionFields: (sectionId: string, activeId: string, overId: string) => void;
  selectedSectionId: string | null;
  // New props for nested field management
  onAddNestedField?: (parentSectionId: string) => void;
  onEditNestedField?: (field: any, parentSectionId: string) => void;
  onDeleteNestedField?: (fieldId: string, parentSectionId: string) => void;
  useNestedView?: boolean;
}

export function FieldsPanel({
  selectedSection,
  isSaving,
  onEdit,
  onDelete,
  onAdd,
  reorderSectionFields,
  selectedSectionId,
  onAddNestedField,
  onEditNestedField,
  onDeleteNestedField,
  useNestedView = true,
}: FieldsPanelProps) {
  // Debug logging
  console.log('FieldsPanel Debug:', {
    useNestedView,
    onAddNestedField: !!onAddNestedField,
    onEditNestedField: !!onEditNestedField,
    onDeleteNestedField: !!onDeleteNestedField,
    selectedSectionFields: selectedSection?.cms_fields?.length
  });

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedSectionId) return;
    reorderSectionFields(selectedSectionId, active.id as string, over.id as string);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Fields
          {selectedSection && <span className="text-sm font-normal text-muted-foreground ml-2">in "{selectedSection.name}"</span>}
        </CardTitle>
        <Button size="sm" onClick={onAdd} disabled={!selectedSectionId || isSaving}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </CardHeader>
      <CardContent>
        {!selectedSection ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Select a section to manage its fields</p>
          </div>
        ) : selectedSection.cms_fields?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No fields yet. Add your first field to get started.</p>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
            <SortableContext items={selectedSection.cms_fields?.map((f: any) => f.id) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {selectedSection.cms_fields?.map((field: any) => {
                  console.log('Rendering field:', field.name, 'type:', field.type, 'useNestedView:', useNestedView);
                  return useNestedView ? (
                    <NestedPayloadField
                      key={field.id}
                      field={field}
                      isSaving={isSaving}
                      onEdit={() => onEdit(field)}
                      onDelete={() => onDelete(field.id)}
                      onAddNestedField={onAddNestedField}
                      onEditNestedField={onEditNestedField}
                      onDeleteNestedField={onDeleteNestedField}
                      onReorderNestedFields={reorderSectionFields}
                    />
                  ) : (
                    <DraggableField
                      key={field.id}
                      field={field}
                      isSaving={isSaving}
                      onEdit={() => onEdit(field)}
                      onDelete={() => onDelete(field.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
} 