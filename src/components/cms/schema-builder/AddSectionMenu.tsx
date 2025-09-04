"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Layout, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";

interface FieldType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export function AddSectionMenu() {
  const { isAddSectionOpen, setSectionFormData, submitSection, closeSectionDialog } = usePageBuilderStore();
  const [sectionData, setSectionData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionData.name.trim()) return;

    setSectionFormData(sectionData);
    submitSection();
    setSectionData({ name: "", description: "" });
  };

  const handleCancel = () => {
    setSectionData({ name: "", description: "" });
    closeSectionDialog();
  };

  return (
    <Dialog open={isAddSectionOpen} onOpenChange={closeSectionDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-muted">
              <Layout className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>Create a new section to organize your content</DialogDescription>
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
              value={sectionData.name}
              onChange={(e) => setSectionData((prev) => ({ ...prev, name: e.target.value }))}
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
              value={sectionData.description}
              onChange={(e) => setSectionData((prev) => ({ ...prev, description: e.target.value }))}
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
              Create Section
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
