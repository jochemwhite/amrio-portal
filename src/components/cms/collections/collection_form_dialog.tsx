"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createCollection, CollectionWithSchema } from "@/actions/cms/collection-actions";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SchemaSelect from "@/components/form-components/schema-select";

// Form validation schema
export const formSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .min(2, "Collection name must be at least 2 characters")
    .max(100, "Collection name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  schema_id: z.string(),
  website_id: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface CollectionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: CollectionWithSchema) => void;
  websiteId: string;
}

export function CollectionFormDialog({ isOpen, onClose, onSuccess, websiteId }: CollectionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      schema_id: "",
      website_id: websiteId,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        description: "",
        schema_id: "",
        website_id: websiteId,
      });
    }
  }, [isOpen, websiteId, form]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const result = await createCollection({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        schema_id: data.schema_id,
        website_id: data.website_id,
      });

      if (result.success && result.data) {
        toast.success("Collection created successfully");
        onSuccess(result.data as CollectionWithSchema);
        onClose();
      } else {
        toast.error(result.error || "Failed to create collection");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="collection-name">Name *</FieldLabel>
                  <Input
                    id="collection-name"
                    placeholder="Team Members"
                    {...field}
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error?.message ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="collection-description">Description</FieldLabel>
                  <Textarea
                    id="collection-description"
                    placeholder="Collection for managing team member profiles"
                    {...field}
                    value={field.value ?? ""}
                    disabled={isSubmitting}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error?.message ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="schema_id"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="collection-schema">Schema</FieldLabel>
                  <div id="collection-schema">
                    <SchemaSelect value={field.value} onChange={field.onChange} type="collection" />
                  </div>
                  {fieldState.error?.message ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
