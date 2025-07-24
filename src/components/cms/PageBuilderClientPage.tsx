"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Plus, Globe, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableSection } from './DraggableSection';
import { DraggableField } from './DraggableField';

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
    await submitField();
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBackToPages} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{page?.name} - Page Builder</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={page?.status === "active" ? "default" : page?.status === "draft" ? "secondary" : "outline"}>{page?.status}</Badge>
              <span className="text-sm text-muted-foreground">/{page?.slug}</span>
              <div className="flex items-center text-sm text-muted-foreground">
                <Globe className="mr-1 h-3 w-3" />
                {page?.cms_websites?.name}
              </div>
              {hasUnsavedChanges && (
                <Badge variant="destructive" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Sections */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Sections</CardTitle>
              <Button size="sm" onClick={openAddSectionDialog} disabled={isSaving}>
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
                          onSelect={() => setSelectedSection(section.id)}
                          onEdit={() => openEditSectionDialog(section)}
                          onDelete={() => deleteSectionById(section.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Fields */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>
                Fields
                {selectedSection && <span className="text-sm font-normal text-muted-foreground ml-2">in "{selectedSection.name}"</span>}
              </CardTitle>
              <Button size="sm" onClick={openAddFieldDialog} disabled={!selectedSectionId || isSaving}>
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
                      {selectedSection.cms_fields?.map((field: any) => (
                        <DraggableField
                          key={field.id}
                          field={field}
                          isSaving={isSaving}
                          onEdit={() => openEditFieldDialog(field)}
                          onDelete={() => deleteFieldById(field.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Section Dialog */}
      <Dialog
        open={isAddSectionOpen || isEditSectionOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSectionDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditSectionOpen ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSectionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="section-name">Name *</Label>
              <Input
                id="section-name"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ name: e.target.value })}
                placeholder="Enter section name"
                required
              />
            </div>
            <div>
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ description: e.target.value })}
                placeholder="Enter section description (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeSectionDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : isEditSectionOpen ? "Update Section" : "Create Section"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Field Dialog */}
      <Dialog
        open={isAddFieldOpen || isEditFieldOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeFieldDialog();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditFieldOpen ? "Edit Field" : "Add New Field"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            <div>
              <Label htmlFor="field-name">Name *</Label>
              <Input
                id="field-name"
                value={fieldFormData.name}
                onChange={(e) => setFieldFormData({ name: e.target.value })}
                placeholder="Enter field name"
                required
              />
            </div>

            <div>
              <Label htmlFor="field-type">Field Type *</Label>
              <Select value={fieldFormData.type} onValueChange={(value) => setFieldFormData({ type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="field-required" checked={fieldFormData.required} onCheckedChange={(checked) => setFieldFormData({ required: checked })} />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            <div>
              <Label htmlFor="field-default">Default Value</Label>
              <Input
                id="field-default"
                value={fieldFormData.default_value}
                onChange={(e) => setFieldFormData({ default_value: e.target.value })}
                placeholder="Enter default value (optional)"
              />
            </div>

            <div>
              <Label htmlFor="field-validation">Validation Rules</Label>
              <Textarea
                id="field-validation"
                value={fieldFormData.validation}
                onChange={(e) => setFieldFormData({ validation: e.target.value })}
                placeholder="Enter validation rules (optional)"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeFieldDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : isEditFieldOpen ? "Update Field" : "Create Field"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Page Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {page?.name}
            </div>
            <div>
              <strong>Status:</strong> {page?.status}
            </div>
            <div>
              <strong>Slug:</strong> /{page?.slug}
            </div>
            <div>
              <strong>Website:</strong> {page?.cms_websites?.name} ({page?.cms_websites?.domain})
            </div>
            {page?.description && (
              <div className="md:col-span-3">
                <strong>Description:</strong> {page.description}
              </div>
            )}
            <div>
              <strong>Created:</strong> {page?.created_at ? new Date(page.created_at).toLocaleDateString() : "Unknown"}
            </div>
            <div>
              <strong>Updated:</strong> {page?.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Never"}
            </div>
            <div>
              <strong>Sections:</strong> {sections.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
