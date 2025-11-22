"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLayoutTemplate } from "@/actions/cms/layout-actions";
import { createSchema } from "@/actions/cms/schema-actions";
import { LayoutTemplate, LayoutTemplateType } from "@/types/cms";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface CreateLayoutTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  type: LayoutTemplateType;
  onCreated: (template: LayoutTemplate) => void;
}

export function CreateLayoutTemplateDialog({
  isOpen,
  onClose,
  websiteId,
  type,
  onCreated,
}: CreateLayoutTemplateDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog opens/closes or type changes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setIsDefault(false);
    }
  }, [isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsCreating(true);

    try {
      // First, create a schema for this template
      const schemaResult = await createSchema({
        name: `${name} Schema`,
        description: `Schema for ${type} template: ${name}`,
        template: false,
        schema_type: "page", // Layout templates use page schema type
      });

      if (!schemaResult.success || !schemaResult.data) {
        toast.error(schemaResult.error || "Failed to create schema");
        setIsCreating(false);
        return;
      }

      // Then create the layout template
      const templateResult = await createLayoutTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        schema_id: schemaResult.data.id,
        website_id: websiteId,
        is_default: isDefault,
      });

      if (templateResult.success && templateResult.data) {
        toast.success(`${type === 'header' ? 'Header' : 'Footer'} template created successfully`);
        onCreated(templateResult.data);
        onClose();
        
        // Optionally redirect to schema builder
        toast.info("Redirecting to schema builder...", { duration: 2000 });
        setTimeout(() => {
          router.push(`/dashboard/websites/${websiteId}/layouts/${templateResult.data!.id}/schema`);
        }, 500);
      } else {
        toast.error(templateResult.error || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Create {type === 'header' ? 'Header' : 'Footer'} Template
            </DialogTitle>
            <DialogDescription>
              Create a new {type} template for your website. You'll be able to design its
              schema and add content after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder={`e.g., Main ${type === 'header' ? 'Header' : 'Footer'}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder={`Describe this ${type} template...`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
                Set as default {type} template
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


