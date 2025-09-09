"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";

export function EditSectionMenu() {
  const { 
    isEditSectionOpen, 
    sectionFormData, 
    setSectionFormData, 
    submitSection, 
    closeSectionDialog,
    isSaving 
  } = usePageBuilderStore();

  const [localFormData, setLocalFormData] = useState({
    name: "",
    description: "",
  });

  // Update local form data when the store form data changes
  useEffect(() => {
    setLocalFormData({
      name: sectionFormData.name || "",
      description: sectionFormData.description || "",
    });
  }, [sectionFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localFormData.name.trim()) return;

    setSectionFormData(localFormData);
    submitSection();
  };

  const handleCancel = () => {
    setLocalFormData({
      name: sectionFormData.name || "",
      description: sectionFormData.description || "",
    });
    closeSectionDialog();
  };

  const handleInputChange = (field: keyof typeof localFormData, value: string) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isEditSectionOpen} onOpenChange={closeSectionDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-muted">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>Update the section name and description</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-section-name" className="text-sm font-medium">
              Section Name *
            </Label>
            <Input
              id="edit-section-name"
              value={localFormData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Hero Section, About Us, Contact Info"
              className="mt-1"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="edit-section-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="edit-section-description"
              value={localFormData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this section is for (optional)"
              className="mt-1"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Update Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


