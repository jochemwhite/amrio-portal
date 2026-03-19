"use client";

import { createLayoutEntry } from "@/actions/cms/layout-actions";
import SchemaSelect from "@/components/form-components/schema-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  schema_id: z.string().min(1, "Please select a schema"),
  type: z.enum(["header", "footer", "sidebar", "custom"]),
  is_default: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface LayoutFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  onSuccess: () => void;
}

export function LayoutFormDialog({ isOpen, onClose, websiteId, onSuccess }: LayoutFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      schema_id: "",
      type: "header",
      is_default: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: FormData) => {
    const result = await createLayoutEntry({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      schema_id: values.schema_id,
      website_id: websiteId,
      type: values.type as Database["public"]["Enums"]["layout_slot_type"],
      is_default: values.is_default,
    });

    if (!result.success) {
      toast.error(result.error || "Failed to create layout");
      return;
    }

    toast.success("Layout created");
    form.reset();
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Layout</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="layout-name">Name *</FieldLabel>
                  <Input id="layout-name" placeholder="Main Site Header" {...field} disabled={isSubmitting} />
                  {fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="layout-type">Type *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger id="layout-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="schema_id"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="layout-schema">Schema *</FieldLabel>
                  <div id="layout-schema">
                    <SchemaSelect value={field.value} onChange={field.onChange} type="layout" />
                  </div>
                  {fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="layout-description">Description</FieldLabel>
                  <Textarea
                    id="layout-description"
                    placeholder="Optional description"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox id="is-default-layout" checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  <label htmlFor="is-default-layout" className="text-sm text-muted-foreground">
                    Set as default for this type
                  </label>
                </div>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Layout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
