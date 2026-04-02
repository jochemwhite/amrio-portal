"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createCollection, CollectionWithSchema, updateCollection } from "@/actions/cms/collection-actions";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SchemaSelect from "@/components/form-components/schema-select";
import { Switch } from "@/components/ui/switch";
import { isValidCollectionSlugPrefix, normalizeCollectionSlugPrefix } from "@/lib/cms/slug-utils";

export const formSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .min(2, "Collection name must be at least 2 characters")
    .max(100, "Collection name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  schema_id: z.string().optional(),
  slug_enabled: z.boolean(),
  slug_prefix: z.string().optional(),
  website_id: z.string(),
}).superRefine((data, ctx) => {
  if (!data.slug_enabled) {
    return;
  }

  const normalizedPrefix = normalizeCollectionSlugPrefix(data.slug_prefix ?? "");
  if (!normalizedPrefix) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["slug_prefix"],
      message: "Slug prefix is required when slugs are enabled",
    });
    return;
  }

  if (!isValidCollectionSlugPrefix(normalizedPrefix)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["slug_prefix"],
      message: "Slug prefix must look like /blog or /news/articles",
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface CollectionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: CollectionWithSchema) => void;
  websiteId: string;
  collection?: CollectionWithSchema | null;
}

export function CollectionFormDialog({ isOpen, onClose, onSuccess, websiteId, collection }: CollectionFormDialogProps) {
  const isEdit = Boolean(collection);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      schema_id: "",
      slug_enabled: false,
      slug_prefix: "",
      website_id: websiteId,
    },
  });

  const slugEnabled = form.watch("slug_enabled");
  const watchedSlugPrefix = form.watch("slug_prefix");
  const normalizedSlugPrefix = normalizeCollectionSlugPrefix(watchedSlugPrefix ?? "");

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: collection?.name ?? "",
        description: collection?.description ?? "",
        schema_id: collection?.schema_id ?? "",
        slug_enabled: Boolean(collection?.slug_prefix),
        slug_prefix: collection?.slug_prefix ?? "",
        website_id: websiteId,
      });
    }
  }, [collection, isOpen, websiteId, form]);

  const handleSubmit = async (data: FormData) => {
    if (!isEdit && !data.schema_id?.trim()) {
      form.setError("schema_id", { message: "Please select a schema" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        slug_prefix: data.slug_enabled ? normalizeCollectionSlugPrefix(data.slug_prefix ?? "") : null,
      };

      const result = isEdit && collection
        ? await updateCollection(collection.id, payload)
        : await createCollection({
            ...payload,
            schema_id: data.schema_id?.trim() ?? "",
            website_id: data.website_id,
          });

      if (result.success && result.data) {
        toast.success(isEdit ? "Collection updated successfully" : "Collection created successfully");
        onSuccess(result.data as CollectionWithSchema);
        onClose();
      } else {
        toast.error(result.error || (isEdit ? "Failed to update collection" : "Failed to create collection"));
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
          <DialogTitle>{isEdit ? "Edit Collection" : "Create Collection"}</DialogTitle>
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

            {!isEdit ? (
              <Controller
                control={form.control}
                name="schema_id"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="collection-schema">Schema</FieldLabel>
                    <div id="collection-schema">
                      <SchemaSelect value={field.value ?? ""} onChange={field.onChange} type="collection" />
                    </div>
                    {fieldState.error?.message ? (
                      <FieldError>{fieldState.error.message}</FieldError>
                    ) : null}
                  </Field>
                )}
              />
            ) : null}

            <Controller
              control={form.control}
              name="slug_enabled"
              render={({ field }) => (
                <Field orientation="horizontal" className="items-start justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="collection-slug-enabled">Enable Entry Slugs</FieldLabel>
                    <FieldDescription>
                      Turn this on to give entries URL paths under a shared prefix like `/blog`.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="collection-slug-enabled"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue("slug_prefix", "", { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </Field>
              )}
            />

            {slugEnabled ? (
              <Controller
                control={form.control}
                name="slug_prefix"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="collection-slug-prefix">Slug Prefix</FieldLabel>
                    <Input
                      id="collection-slug-prefix"
                      placeholder="/blog"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        field.onChange(normalizeCollectionSlugPrefix(event.target.value));
                      }}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Entries in this collection can use URLs like `{normalizedSlugPrefix || "/blog"}/about-me`.
                    </FieldDescription>
                    {fieldState.error?.message ? (
                      <FieldError>{fieldState.error.message}</FieldError>
                    ) : null}
                  </Field>
                )}
              />
            ) : null}
          </FieldGroup>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Collection")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
