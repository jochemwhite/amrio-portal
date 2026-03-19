"use client";

import { useState, useEffect } from "react";
import { Schema } from "@/types/cms";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSchema, updateSchema } from "@/actions/cms/schema-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

interface SchemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema?: Schema | null;
  onSuccess?: () => void;
}

export function SchemaFormDialog({ open, onOpenChange, schema, onSuccess }: SchemaFormDialogProps) {
  type SchemaTypeOption = Database["public"]["Enums"]["schema_type"] | "layout";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [schemaType, setSchemaType] = useState<SchemaTypeOption>("page");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!schema;

  useEffect(() => {
    if (schema) {
      setName(schema.name);
      setDescription(schema.description || "");
      setIsTemplate(schema.template);
      setSchemaType(schema.schema_type as SchemaTypeOption);
    } else {
      setName("");
      setDescription("");
      setIsTemplate(false);
      setSchemaType("page");
    }
  }, [schema, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a schema name");
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (isEdit && schema) {
        result = await updateSchema(schema.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          template: isTemplate,
          schema_type: schemaType as Database["public"]["Enums"]["schema_type"],
        });
      } else {
        result = await createSchema({
          name: name.trim(),
          description: description.trim() || undefined,
          template: isTemplate,
          schema_type: schemaType as Database["public"]["Enums"]["schema_type"],
        });
      }

      if (result.success) {
        toast.success(isEdit ? "Schema updated successfully" : "Schema created successfully");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to save schema");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Schema" : "Create New Schema"}</DialogTitle>
            <DialogDescription>{isEdit ? "Update the schema details below." : "Create a new schema for your content structure."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Blog Post, Product, Event"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schema-type">Schema Type</Label>
              <Select value={schemaType} onValueChange={(value) => setSchemaType(value as SchemaTypeOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schema type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="layout">Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this schema is used for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
