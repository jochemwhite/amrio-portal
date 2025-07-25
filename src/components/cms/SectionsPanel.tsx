import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableSection } from './DraggableSection';

interface SectionsPanelProps {
  sections: any[];
  selectedSectionId: string | null;
  isSaving: boolean;
  onSelect: (id: string) => void;
  onEdit: (section: any) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  reorderSections: (activeId: string, overId: string) => void;
}

export function SectionsPanel({
  sections,
  selectedSectionId,
  isSaving,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  reorderSections,
}: SectionsPanelProps) {
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSections(active.id as string, over.id as string);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Sections</CardTitle>
        <Button size="sm" onClick={onAdd} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No sections yet. Create your first section to get started.</p>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sections.map((section: any) => (
                  <DraggableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    isSaving={isSaving}
                    onSelect={() => onSelect(section.id)}
                    onEdit={() => onEdit(section)}
                    onDelete={() => onDelete(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
} 