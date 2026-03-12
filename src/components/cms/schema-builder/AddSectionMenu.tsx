"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layout, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";

export function AddSectionMenu() {
  // Use explicit selectors to ensure proper re-renders on state changes
  const isAddSectionOpen = useSchemaBuilderStore((state) => state.isAddSectionOpen);
  const isEditSectionOpen = useSchemaBuilderStore((state) => state.isEditSectionOpen);
  const sectionFormData = useSchemaBuilderStore((state) => state.sectionFormData);
  const setSectionFormData = useSchemaBuilderStore((state) => state.setSectionFormData);
  const submitSection = useSchemaBuilderStore((state) => state.submitSection);
  const closeSectionDialog = useSchemaBuilderStore((state) => state.closeSectionDialog);

  const isOpen = isAddSectionOpen || isEditSectionOpen;
  const isEdit = isEditSectionOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionFormData.name.trim()) return;
    submitSection();
  };

  const handleCancel = () => {
    closeSectionDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-muted">
              <Layout className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Section" : "Add Section"}</DialogTitle>
              <DialogDescription>
                {isEdit ? "Update your section details" : "Create a new section to organize your content"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="section-name" className="text-sm font-medium">
              Section Name *
            </Label>
            <Input
              id="section-name"
              value={sectionFormData.name}
              onChange={(e) => setSectionFormData({ name: e.target.value })}
              placeholder="e.g., Hero Section, About Us, Contact Info"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="section-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="section-description"
              value={sectionFormData.description}
              onChange={(e) => setSectionFormData({ description: e.target.value })}
              placeholder="Describe what this section is for (optional)"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {isEdit ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
