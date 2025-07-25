"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, FileText, Globe, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DraggableField } from './DraggableField';
import { DraggableSection } from './DraggableSection';
import { PageBuilderHeader } from "./PageBuilderHeader";
import { SectionsPanel } from "./SectionsPanel";
import { FieldsPanel } from "./FieldsPanel";
import { SectionDialog } from "./SectionDialog";
import { FieldDialog } from "./FieldDialog";
import { PageInfoCard } from "./PageInfoCard";

interface PageBuilderClientPageProps {
  initialPage: any;
  websiteId: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "richtext", label: "Rich Text" },
  { value: "image", label: "Image" },
  { value: "reference", label: "Reference" },
];

export function PageBuilderClientPage({ initialPage, websiteId }: PageBuilderClientPageProps) {
  const router = useRouter();

  // Get all state and actions from Zustand store
  const {
    page,
    sections,
    selectedSectionId,
    hasUnsavedChanges,
    isSaving,

    // Section state
    isAddSectionOpen,
    isEditSectionOpen,
    sectionFormData,

    // Field state
    isAddFieldOpen,
    isEditFieldOpen,
    fieldFormData,

    // Actions
    initializeStore,
    setSelectedSection,

    // Section actions
    openAddSectionDialog,
    openEditSectionDialog,
    closeSectionDialog,
    setSectionFormData,
    submitSection,
    deleteSectionById,

    // Field actions
    openAddFieldDialog,
    openEditFieldDialog,
    closeFieldDialog,
    setFieldFormData,
    submitField,
    deleteFieldById,
    
    // Drag and drop actions
    reorderSections,
    reorderSectionFields,
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
    router.push(`/dashboard/websites/${websiteId}/pages`);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSection();
  };

  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // await submitField();
  };

  // Drag and drop handlers
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    reorderSections(active.id as string, over.id as string);
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !selectedSectionId) return;
    
    reorderSectionFields(selectedSectionId, active.id as string, over.id as string);
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <>
      {/* Header */}
      <PageBuilderHeader
        page={page}
        websiteId={websiteId}
        hasUnsavedChanges={hasUnsavedChanges}
        onBack={handleBackToPages}
      />

      {/* Page Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Sections */}
        <SectionsPanel
          sections={sections}
          selectedSectionId={selectedSectionId}
          isSaving={isSaving}
          onSelect={setSelectedSection}
          onEdit={openEditSectionDialog}
          onDelete={deleteSectionById}
          onAdd={openAddSectionDialog}
          reorderSections={reorderSections}
        />

        {/* Right Column - Fields */}
        <FieldsPanel
          selectedSection={selectedSection}
          isSaving={isSaving}
          onEdit={openEditFieldDialog}
          onDelete={deleteFieldById}
          onAdd={openAddFieldDialog}
          reorderSectionFields={reorderSectionFields}
          selectedSectionId={selectedSectionId}
        />
      </div>

      {/* Add/Edit Section Dialog */}
      <SectionDialog
        isOpen={isAddSectionOpen || isEditSectionOpen}
        isEdit={isEditSectionOpen}
        isSaving={isSaving}
        formData={sectionFormData}
        onChange={setSectionFormData}
        onClose={closeSectionDialog}
        onSubmit={handleSectionSubmit}
      />

      {/* Add/Edit Field Dialog */}
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

      {/* Page Info */}
      <PageInfoCard page={page} sectionsCount={sections.length} />
    </>
  );
}
