"use client";

import { createPage, updatePage } from "@/actions/cms/page-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { createClient } from "@/lib/supabase/supabaseClient";
import { useActiveTenant } from "@/hooks/use-active-tenant";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Page name is required")
    .min(2, "Page name must be at least 2 characters")
    .max(100, "Page name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .refine((slug) => slug === "/" || /^[a-z0-9-]+$/.test(slug), "Slug can only contain lowercase letters, numbers, and hyphens (or '/' for home)")
    .refine((slug) => slug === "/" || (!slug.startsWith("-") && !slug.endsWith("-")), "Slug cannot start or end with a hyphen"),
  status: z.enum(["draft", "active", "archived"] as const),
  schema_id: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface PageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: Database["public"]["Tables"]["cms_pages"]["Row"]) => void;
  page?: Database["public"]["Tables"]["cms_pages"]["Row"]; // undefined for create, string for edit
  websiteId: string;
}

export function PageForm({ isOpen, onClose, onSuccess, page, websiteId }: PageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemas, setSchemas] = useState<Array<{ id: string; name: string; description: string | null; template: boolean }>>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [websiteDomain, setWebsiteDomain] = useState<string>("");
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(false);
  const [slugCheckStatus, setSlugCheckStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  const isEditing = !!page;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      status: "draft",
      schema_id: "",
    },
  });

  const watchedName = form.watch("name");
  const watchedSlug = form.watch("slug");

  // Load website info when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadWebsiteInfo();
    }
  }, [isOpen, websiteId]);

  // Load schemas when dialog opens
  useEffect(() => {
    if (isOpen && !isEditing) {
      loadSchemas();
    }
  }, [isOpen, isEditing]);

  // Initialize form data when editing
  useEffect(() => {
    if (isEditing) {
      form.reset({
        name: page.name,
        description: page.description || "",
        slug: page.slug,
        status: page.status || "draft",
        schema_id: page.schema_id || "",
      });
    } else {
      // Reset form for create
      form.reset({
        name: "",
        description: "",
        slug: "",
        status: "draft",
        schema_id: "",
      });
    }
    // Reset slug check status when form opens
    setSlugCheckStatus("idle");
  }, [isEditing, page, isOpen, form]);

  // Load website info function
  const loadWebsiteInfo = async () => {
    setIsLoadingWebsite(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("cms_websites").select("domain").eq("id", websiteId).single();

      if (error) throw error;
      setWebsiteDomain(data?.domain || "example.com");
    } catch (error) {
      console.error("Error loading website:", error);
      setWebsiteDomain("example.com");
    } finally {
      setIsLoadingWebsite(false);
    }
  };

  // Load schemas function
  const loadSchemas = async () => {
    setIsLoadingSchemas(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("cms_schemas").select("id, name, description, template").order("name");

      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      console.error("Error loading schemas:", error);
      toast.error("Failed to load schemas");
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  // Auto-generate slug from name when slug field is empty (with debounce)
  useEffect(() => {
    if (watchedName && (!watchedSlug || watchedSlug.trim() === "")) {
      const timeoutId = setTimeout(() => {
        const generatedSlug = generateSlug(watchedName);
        form.setValue("slug", generatedSlug);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [watchedName, watchedSlug, form]);

  // Check slug availability when slug changes (with debounce)
  useEffect(() => {
    if (!watchedSlug || watchedSlug.trim() === "" || form.formState.errors.slug) {
      setSlugCheckStatus("idle");
      return;
    }

    setSlugCheckStatus("checking");

    const timeoutId = setTimeout(async () => {
      const isAvailable = await checkSlugAvailability(watchedSlug, page?.id);
      setSlugCheckStatus(isAvailable ? "available" : "unavailable");
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [watchedSlug, page?.id, websiteId, form.formState.errors.slug]);

  const generateSlug = (name: string): string => {
    // Handle special case for home page
    if (name.toLowerCase().trim() === "home") {
      return "/";
    }

    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string, excludePageId?: string): Promise<boolean> => {
    if (!slug || slug.trim() === "") {
      return false;
    }

    try {
      const supabase = createClient();
      let query = supabase.from("cms_pages").select("id").eq("website_id", websiteId).eq("slug", slug.trim());

      // Exclude current page if editing
      if (excludePageId) {
        query = query.neq("id", excludePageId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error checking slug availability:", error);
        return false;
      }

      // Slug is available if no pages were found
      return data.length === 0;
    } catch (error) {
      console.error("Error checking slug availability:", error);
      return false;
    }
  };

  const handleSubmit = async (data: FormData) => {
    // Additional validation for slug availability
    const isAvailable = await checkSlugAvailability(data.slug, page?.id);
    if (!isAvailable) {
      form.setError("slug", { message: "This slug is already in use" });
      setSlugCheckStatus("unavailable");
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

        if (result.success) {
          toast.success("Page updated successfully");
          onSuccess(result.data as Database["public"]["Tables"]["cms_pages"]["Row"]);
        } else {
          toast.error(result.error || "Failed to update page");
          return;
        }
      } else {
        const result = await createPage({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          slug: data.slug.trim(),
          status: data.status,
          schema_id: data.schema_id,
        });

        if (result.success) {
          toast.success("Page created successfully");
          onSuccess(result.data as Database["public"]["Tables"]["cms_pages"]["Row"]);
        } else {
          toast.error(result.error || "Failed to create page");
          return;
        }
      }

      onClose();
    } catch (error) {
      toast.error(isEditing ? "Failed to update page" : "Failed to create page");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlugGenerate = () => {
    if (watchedName) {
      // Clear the slug field first, then let the auto-generation handle it
      form.setValue("slug", "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Page" : "Create New Page"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.log("Errors", errors);
            })}
            className="space-y-6"
          >
            {/* Website Selection (for create only) */}

            <div className="flex flex-col gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., About Us, Contact, Home" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                              Draft
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                              Archived
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Schema Selection (only for create) */}
                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="schema_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schema (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            // Convert "none" back to empty string
                            field.onChange(value === "none" ? "" : value);
                          }}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a schema..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              <div className="flex items-center">
                                <span className="text-muted-foreground">No schema</span>
                              </div>
                            </SelectItem>
                            {isLoadingSchemas ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading schemas...
                                </div>
                              </SelectItem>
                            ) : (
                              schemas.map((schema) => (
                                <SelectItem key={schema.id} value={schema.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{schema.name}</span>
                                    {schema.template && (
                                      <Badge variant="secondary" className="text-xs">
                                        Template
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">Select a schema to automatically create content fields for this page.</p>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input placeholder="page-slug" {...field} className="pr-10" />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugCheckStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />}
                          {slugCheckStatus === "available" && <Check className="h-4 w-4 text-green-600" />}
                          {slugCheckStatus === "unavailable" && <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleSlugGenerate} disabled={!watchedName}>
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label className="text-sm">URL Preview</Label>
                <div className="p-2 bg-muted rounded text-sm font-mono">
                  <span className={slugCheckStatus === "available" ? "text-green-600" : "text-muted-foreground"}>
                    {isLoadingWebsite ? "Loading..." : `https://${websiteDomain}${watchedSlug === "/" ? "" : `/${watchedSlug || "page-slug"}`}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {slugCheckStatus === "available" ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    Slug is available
                  </div>
                ) : slugCheckStatus === "checking" ? (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Checking availability...
                  </div>
                ) : slugCheckStatus === "unavailable" ? (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Slug is already in use
                  </div>
                ) : null}
              </div>
              {isEditing && page && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Page Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Schema ID:</span>
                        <Badge variant="secondary">{page.schema_id || "None"}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant="secondary">{page.status || "Draft"}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Never"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
