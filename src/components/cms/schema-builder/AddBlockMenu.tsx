"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Layout, Plus } from "lucide-react";

interface FieldType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface AddBlockMenuProps {
  onAddSection: (name: string, description: string) => void;
  onClose: () => void;
  fieldTypes: FieldType[];
}

export function AddBlockMenu({ onAddSection, onClose, fieldTypes }: AddBlockMenuProps) {
  const [sectionData, setSectionData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionData.name.trim()) return;

    onAddSection(sectionData.name, sectionData.description);
    setSectionData({ name: "", description: "" });
  };

  const handleCancel = () => {
    setSectionData({ name: "", description: "" });
    onClose();
  };

  return (
    <Card className="border-2 ">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2  rounded-lg">
              <Layout className="h-5 w-5 " />
            </div>
            <div>
              <h3 className="text-lg font-medium ">Add Content Block</h3>
              <p className="text-sm text-gray-500">Create a new section to organize your content</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

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

          <div className="flex justify-end space-x-2 pt-4  ">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="">
              <Plus className="mr-2 h-4 w-4" />
              Create Block
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
