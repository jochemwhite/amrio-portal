"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSchemaBuilderStore } from "@/stores/useSchemaBuilderStore";
import { FieldType } from "@/types/cms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FIELD_TYPES } from "../shared/field-types";
import CollectionPicker from "./CollectionPicker";

// Form validation schema
const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .min(2, "Field name must be at least 2 characters")
    .max(50, "Field name must be less than 50 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Field name must start with a letter and contain only letters, numbers, and underscores"),
  type: z.string().min(1, "Field type is required"),
  required: z.boolean().default(false),
  default_value: z.string().optional(),
  validation: z.string().optional(),
  collection_id: z.string().optional(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

export function AddFieldMenu() {
  const { isAddFieldOpen, isEditFieldOpen, setFieldFormData, submitField, closeFieldDialog, fieldFormData, editingFieldId } = useSchemaBuilderStore();
  const isEditMode = !!editingFieldId;
  const isDialogOpen = isAddFieldOpen || isEditFieldOpen; // Check both states
  const [selectedType, setSelectedType] = useState<string | null>(fieldFormData.type || null);

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: fieldFormData.name,
      type: fieldFormData.type,
      required: fieldFormData.required,
      default_value: fieldFormData.default_value,
      validation: fieldFormData.validation,
      collection_id: fieldFormData.collection_id,
    },
  });

  // Update form when fieldFormData changes (important for edit mode)
  useEffect(() => {
    if (isDialogOpen) {
      // Use isDialogOpen instead of just isAddFieldOpen
      form.reset({
        name: fieldFormData.name,
        type: fieldFormData.type,
        required: fieldFormData.required,
        default_value: fieldFormData.default_value,
        validation: fieldFormData.validation,
        collection_id: fieldFormData.collection_id,
      });
      setSelectedType(fieldFormData.type || null);
    }
  }, [isDialogOpen, fieldFormData, form]); // Use isDialogOpen

  const handleTypeSelect = (type: FieldType) => {
    setSelectedType(type.value);
    form.setValue("type", type.value);
  };

  const handleBackToTypeSelection = () => {
    setSelectedType(null);
    form.reset();
  };

  const onSubmit = (data: FieldFormData) => {
    setFieldFormData({
      name: data.name,
      type: data.type,
      required: data.required,
      default_value: data.default_value || "",
      validation: data.validation || "",
      collection_id: data.collection_id || "",
    });
    submitField();
    handleCancel();
  };

  const handleCancel = () => {
    form.reset();
    setSelectedType(null);
    closeFieldDialog();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCancel}>
      {" "}
      {/* Use isDialogOpen */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? `Edit ${FIELD_TYPES.find((t) => t.value === selectedType)?.label} Field`
              : !selectedType
                ? "Add New Field"
                : `Add ${FIELD_TYPES.find((t) => t.value === selectedType)?.label} Field`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your field properties and validation rules"
              : !selectedType
                ? "Choose a field type to get started"
                : "Configure your field properties and validation rules"}
          </DialogDescription>
        </DialogHeader>

        {!selectedType && !isEditMode ? (
          <div className="grid grid-cols-1 gap-3 py-4">
            {FIELD_TYPES.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                onClick={() => handleTypeSelect(type)}
                className="flex items-center justify-start space-x-3 p-4 h-auto text-left"
              >
                <span className="text-lg">{type.icon}</span>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter field name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for this field. Must start with a letter and contain only letters, numbers, and underscores.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Field</FormLabel>
                      <FormDescription>Make this field mandatory for content creation</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {selectedType !== "boolean" && selectedType !== "reference" && (
                <FormField
                  control={form.control}
                  name="default_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter default value (optional)" {...field} />
                      </FormControl>
                      <FormDescription>The default value that will be pre-filled for this field</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "reference" && (
                <FormField
                  control={form.control}
                  name="collection_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Collection</FormLabel>
                      <FormControl>
                        <CollectionPicker collectionId={field.value} setCollectionId={field.onChange} />
                      </FormControl>
                      <FormDescription>The ID of the collection to reference</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="validation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validation Rules</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter validation rules (optional)" rows={3} {...field} />
                    </FormControl>
                    <FormDescription>Custom validation rules or constraints for this field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                {!isEditMode && (
                  <Button type="button" variant="ghost" onClick={handleBackToTypeSelection}>
                    ← Back to Field Types
                  </Button>
                )}
                <div className={`flex space-x-3 ${isEditMode ? "ml-auto" : ""}`}>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">{isEditMode ? "Update Field" : "Add Field"}</Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
