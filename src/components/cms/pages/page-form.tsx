"use client";

import { createPage, updatePage } from "@/actions/cms/page-actions";
import SchemaSelect from "@/components/form-components/schema-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/supabaseClient";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(1, "Page name is required")
    .min(2, "Page name must be at least 2 characters")
    .max(100, "Page name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .refine(
      (slug) => slug === "/" || /^[a-z0-9-]+$/.test(slug),
      "Slug can only contain lowercase letters, numbers, and hyphens (or '/' for home)"
    )
    .refine(
      (slug) => slug === "/" || (!slug.startsWith("-") && !slug.endsWith("-")),
      "Slug cannot start or end with a hyphen"
    ),
  status: z.enum(["draft", "active", "archived"] as const),
  schema_id: z.string().uuid("Please select a schema"),
  website_id: z.string(),
});

type FormData = z.infer<typeof formSchema>;

type PageRow = Database["public"]["Tables"]["cms_pages"]["Row"] & { cms_content_sections: number };

interface PageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PageRow) => void;
  page?: PageRow;
  websiteId: string;
}

function generateSlug(name: string): string {
  if (name.toLowerCase().trim() === "home") return "/";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function PageForm({ isOpen, onClose, onSuccess, page, websiteId }: PageFormProps) {
  const isEditing = !!page;

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [websiteDomain, setWebsiteDomain] = useState("");
  const [slugStatus, setSlugStatus]       = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  // Track whether the user has manually edited the slug
  const slugManuallyEdited = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      status: "draft",
      schema_id: "",
      website_id: websiteId,
    },
  });

  const watchedName = form.watch("name");
  const watchedSlug = form.watch("slug");

  // Load website domain once when websiteId changes
  useEffect(() => {
    if (!websiteId) return;
    const supabase = createClient();
    supabase
      .from("cms_websites")
      .select("domain")
      .eq("id", websiteId)
      .single()
      .then(({ data }) => setWebsiteDomain(data?.domain || "example.com"))
  }, [websiteId]);

  // Reset form when dialog opens/closes or switches between create/edit
  useEffect(() => {
    if (!isOpen) return;
    slugManuallyEdited.current = false;
    setSlugStatus("idle");

    if (isEditing && page) {
      form.reset({
        name: page.name,
        description: page.description || "",
        slug: page.slug,
        status: page.status || "draft",
        schema_id: page.schema_id || "",
        website_id: websiteId,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        slug: "",
        status: "draft",
        schema_id: "",
        website_id: websiteId,
      });
    }
  }, [isOpen]);

  // Auto-generate slug from name (only if user hasn't manually edited it)
  useEffect(() => {
    if (isEditing || slugManuallyEdited.current || !watchedName) return;

    const id = setTimeout(() => {
      form.setValue("slug", generateSlug(watchedName), { shouldValidate: true });
    }, 300);

    return () => clearTimeout(id);
  }, [watchedName]);

  // Check slug availability
  useEffect(() => {
    if (!watchedSlug || watchedSlug.trim() === "") {
      setSlugStatus("idle");
      return;
    }

    // Don't check if there's a format validation error
    if (form.formState.errors.slug?.message && !form.formState.errors.slug.message.includes("use")) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    const id = setTimeout(async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from("cms_pages")
          .select("id")
          .eq("website_id", websiteId)
          .eq("slug", watchedSlug.trim());

        if (page?.id) query = query.neq("id", page.id);

        const { data } = await query;
        setSlugStatus(data && data.length === 0 ? "available" : "unavailable");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(id);
  }, [watchedSlug]);

  const handleSubmit = async (data: FormData) => {
    // Re-check slug before submitting
    if (slugStatus === "unavailable") {
      form.setError("slug", { message: "This slug is already in use" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const result = await updatePage(page!.id, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          slug: data.slug.trim(),
          status: data.status,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to update page");
          return;
        }

        toast.success("Page updated successfully");
        onSuccess({
          ...(result.data as Database["public"]["Tables"]["cms_pages"]["Row"]),
          cms_content_sections: page?.cms_content_sections || 0,
        });
      } else {
        const result = await createPage({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          slug: data.slug.trim(),
          status: data.status,
          schema_id: data.schema_id,
          website_id: data.website_id,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to create page");
          return;
        }

        toast.success("Page created successfully");
        onSuccess({
          ...(result.data as Database["public"]["Tables"]["cms_pages"]["Row"]),
          cms_content_sections: 0,
        });
      }

      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update page" : "Failed to create page");
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlPreview = `https://${websiteDomain || "example.com"}${watchedSlug === "/" ? "" : `/${watchedSlug || "page-slug"}`}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Page" : "Create New Page"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>

            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Page Name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    placeholder="e.g., About Us, Contact, Home"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            {/* Status */}
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Draft
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="archived">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full" />
                          Archived
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            {/* Schema (create only) */}
            {!isEditing && (
              <Controller
                name="schema_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schema_id">Schema</FieldLabel>
                    <SchemaSelect value={field.value} onChange={field.onChange} type="page" />
                    <p className="text-sm text-muted-foreground">
                      Select a schema to automatically create content fields for this page.
                    </p>
                    {fieldState.invalid && fieldState.error?.message && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            )}

            {/* Slug */}
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        {...field}
                        id="slug"
                        placeholder="page-slug"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                        onChange={(e) => {
                          slugManuallyEdited.current = true;
                          field.onChange(e);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {slugStatus === "checking"   && <Loader2    className="h-4 w-4 animate-spin text-yellow-500" />}
                        {slugStatus === "available"  && <Check      className="h-4 w-4 text-green-500" />}
                        {slugStatus === "unavailable"&& <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!watchedName}
                      onClick={() => {
                        slugManuallyEdited.current = false;
                        form.setValue("slug", generateSlug(watchedName), { shouldValidate: true });
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                  {/* Slug status message */}
                  {!fieldState.invalid && (
                    <p className={`text-xs ${
                      slugStatus === "available"   ? "text-green-500" :
                      slugStatus === "unavailable" ? "text-red-500"   :
                      slugStatus === "checking"    ? "text-yellow-500":
                      "text-transparent"
                    }`}>
                      {slugStatus === "available"   ? "✓ Slug is available"        :
                       slugStatus === "unavailable" ? "✗ Slug is already in use"   :
                       slugStatus === "checking"    ? "Checking availability..."    :
                       "​" /* zero-width space to preserve height */}
                    </p>
                  )}
                </Field>
              )}
            />

            {/* URL preview */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">URL Preview</p>
              <div className="p-2 bg-muted rounded text-sm font-mono text-muted-foreground truncate">
                {urlPreview}
              </div>
            </div>

            {/* Page info (edit only) */}
            {isEditing && page && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Page Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Schema ID</span>
                    <Badge variant="secondary">{page.schema_id || "None"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary">{page.status || "Draft"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

          </FieldGroup>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || slugStatus === "unavailable"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? "Update Page" : "Create Page"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}