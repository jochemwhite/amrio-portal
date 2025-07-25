"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Eye, Globe, Plus, Save, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddBlockMenu } from "./AddBlockMenu";
import { PayloadSection } from "./PayloadSection";
import { PageSettingsDialog } from "./PageSettingsDialog";
import { SectionDialog } from "./SectionDialog";
import { FieldDialog } from "./FieldDialog";

interface PayloadStylePageBuilderProps {
  initialPage: any;
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
  const router = useRouter();
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  // Get all state and actions from Zustand store
  const {
    page,
    sections,
    selectedSectionId,
    hasUnsavedChanges,
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
    openPageSettings,
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
    saveChanges,
  } = usePageBuilderStore();

  // Initialize the store with page data
  useEffect(() => {
    initializeStore(initialPage, websiteId);
  }, [initialPage, websiteId, initializeStore]);

  const handleBackToPages = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    router.push(`/dashboard/websites/${websiteId}`);
  };

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
      <div className=" border-b  sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBackToPages} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold ">{page?.name}</h1>
                <div className="flex items-center space-x-2 text-sm ">
                  <Globe className="h-3 w-3" />
                  <span>{page?.cms_websites?.name}</span>
                  <span>•</span>
                  <Badge variant={page?.status === "active" ? "default" : "secondary"}>{page?.status}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <Badge variant="destructive" className="animate-pulse">
                  Unsaved
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button size="sm" disabled={isSaving || !hasUnsavedChanges} onClick={() => saveChanges()}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Info Card */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium ">Page Settings</h2>
              <Button variant="ghost" size="sm" onClick={openPageSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ">
              <div>
                <span className="font-medium">Slug:</span> /{page?.slug}
              </div>
              <div>
                <span className="font-medium">Created:</span> {page?.created_at ? new Date(page.created_at).toLocaleDateString() : "Unknown"}
              </div>
              <div>
                <span className="font-medium">Sections:</span> {sections.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium ">Content Blocks</h2>
            <Button onClick={() => setShowAddMenu("page")} className=" ">
              <Plus className="mr-2 h-4 w-4" />
              Add Block
            </Button>
          </div>

          {sections.length === 0 ? (
            <Card className="border-2 border-dashed ">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content blocks yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first content block</p>
                <Button onClick={() => setShowAddMenu("page")} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Block
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {sections.map((section: any, index: number) => (
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
        </div>
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
