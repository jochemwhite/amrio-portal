"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { SupabasePageWithRelations } from "@/types/cms";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ContentEditor } from "../content-editor/ContentEditor";
import { CmsHeader } from "../shared/cmsHeader";
import { PageInfo } from "../shared/PageInfo";
import { PageSettingsDialog } from "../shared/PageSettingsDialog";
import { AddBlockMenu } from "./AddBlockMenu";
import { FieldDialog } from "./FieldDialog";
import { PayloadSection } from "./PayloadSection";
import { SectionDialog } from "./SectionDialog";

interface PayloadStylePageBuilderProps {
  initialPage: SupabasePageWithRelations;
  websiteId: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: "📝", description: "Simple text input" },
  { value: "richtext", label: "Rich Text", icon: "📄", description: "WYSIWYG editor" },
  { value: "number", label: "Number", icon: "🔢", description: "Numeric input" },
  { value: "boolean", label: "Checkbox", icon: "☑️", description: "True/false toggle" },
  { value: "date", label: "Date", icon: "📅", description: "Date picker" },
  { value: "image", label: "Image", icon: "🖼️", description: "Image upload" },
  { value: "reference", label: "Relationship", icon: "🔗", description: "Reference to other content" },
];

export function PayloadStylePageBuilder({ initialPage, websiteId }: PayloadStylePageBuilderProps) {
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  // Get all state and actions from Zustand store
  const {
    page,
    sections,
    selectedSectionId,
    isSaving,
    // Page settings
    isPageSettingsOpen,
    pageSettingsData,
    // Section dialog state
    isAddSectionOpen,
    isEditSectionOpen,
    sectionFormData,
    // Field dialog state
    isAddFieldOpen,
    isEditFieldOpen,
    fieldFormData,
    // Actions
    initializeStore,
    setSelectedSection,
    // Page settings actions
    closePageSettings,
    setPageSettingsData,
    submitPageSettings,
    // Section actions
    openEditSectionDialog,
    closeSectionDialog,
    setSectionFormData,
    submitSection,
    deleteSectionById,
    // Field actions
    openEditFieldDialog,
    closeFieldDialog,
    setFieldFormData,
    submitField,
    deleteFieldById,
    // Drag and drop actions
    reorderSections,
    reorderSectionFields,
    // Mode switching
    mode,
    setMode,
  } = usePageBuilderStore();

  // Initialize the store with page data
  useEffect(() => {
    initializeStore(initialPage, websiteId);
  }, [initialPage, websiteId, initializeStore]);

  // Drag and drop handlers
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    reorderSections(active.id as string, over.id as string);
  };

  const handleFieldReorder = (sectionId: string, activeId: string, overId: string) => {
    reorderSectionFields(sectionId, activeId, overId);
  };

  const handleAddSection = (name: string, description: string) => {
    setSectionFormData({ name, description });
    submitSection();
    setShowAddMenu(null);
  };

  const handlePageSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPageSettings();
  };

  const handleSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSection();
  };

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitField();
  };

  const handleAddField = (sectionId: string, fieldData: any) => {
    setSelectedSection(sectionId);
    setFieldFormData(fieldData);
    submitField();
    setShowAddMenu(null);
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <CmsHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Info Card */}
        <PageInfo />

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as "schema" | "content")} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="schema">Schema Builder</TabsTrigger>
              <TabsTrigger value="content">Content Editor</TabsTrigger>
            </TabsList>
            {mode === "schema" && (
              <Button onClick={() => setShowAddMenu("page")} className=" ">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            )}
          </div>

          {/* Schema Builder Tab */}
          <TabsContent value="schema" className="space-y-6">
            {sections.length === 0 ? (
              <Card className="border-2 border-dashed ">
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Plus className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content sections yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first content section</p>
                  <Button onClick={() => setShowAddMenu("page")} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Section
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {sections.map((section, index: number) => (
                      <PayloadSection
                        key={section.id}
                        section={section}
                        index={index}
                        isSelected={selectedSectionId === section.id}
                        isSaving={isSaving}
                        onSelect={(id: string) => setSelectedSection(id)}
                        onEdit={() => openEditSectionDialog(section)}
                        onDelete={() => deleteSectionById(section.id)}
                        onAddField={(fieldData: any) => handleAddField(section.id, fieldData)}
                        onEditField={openEditFieldDialog}
                        onDeleteField={deleteFieldById}
                        onReorderFields={handleFieldReorder}
                        showAddMenu={showAddMenu === section.id}
                        onShowAddMenu={() => setShowAddMenu(showAddMenu === section.id ? null : section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add Block Menu */}
            {showAddMenu === "page" && <AddBlockMenu onAddSection={handleAddSection} onClose={() => setShowAddMenu(null)} fieldTypes={FIELD_TYPES} />}
          </TabsContent>

          {/* Content Editor Tab */}
          <TabsContent value="content">
            <ContentEditor pageId={page?.id || ""} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Page Settings Dialog */}
      <PageSettingsDialog
        isOpen={isPageSettingsOpen}
        isSaving={isSaving}
        formData={pageSettingsData}
        onChange={setPageSettingsData}
        onClose={closePageSettings}
        onSubmit={handlePageSettingsSubmit}
      />

      {/* Section Dialog */}
      <SectionDialog
        isOpen={isAddSectionOpen || isEditSectionOpen}
        isEdit={isEditSectionOpen}
        isSaving={isSaving}
        formData={sectionFormData}
        onChange={setSectionFormData}
        onClose={closeSectionDialog}
        onSubmit={handleSectionSubmit}
      />

      {/* Field Dialog */}
      <FieldDialog
        isOpen={isAddFieldOpen || isEditFieldOpen}
        isEdit={isEditFieldOpen}
        isSaving={isSaving}
        formData={fieldFormData}
        onChange={setFieldFormData}
        onClose={closeFieldDialog}
        onSubmit={handleFieldSubmit}
        fieldTypes={FIELD_TYPES}
      />
    </div>
  );
}
