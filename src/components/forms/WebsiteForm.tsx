"use client";

import { createWebsite, updateWebsite } from "@/actions/cms/website-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Database } from "@/types/supabase";

type Website = Database["public"]["Tables"]["cms_websites"]["Row"];

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Website name is required")
    .min(2, "Website name must be at least 2 characters")
    .max(100, "Website name must be less than 100 characters"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost(:[0-9]{1,5})?$/,
      "Please enter a valid domain (e.g., example.com)"
    ),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["active", "inactive", "maintenance"] as const),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: Website) => void;
  website?: Website;
}

export function WebsiteForm({ isOpen, onClose, onSuccess, website }: WebsiteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeTenant } = useActiveTenant();

  const isEditing = !!website;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      domain: "",
      description: "",
      status: "active" as const,
    },
  });

  // Initialize form data when editing or creating
  useEffect(() => {
    if (isEditing && website) {
      const status = website.status || "active";
      form.reset({
        name: website.name,
        domain: website.domain,
        description: website.description || "",
        status: (status === "active" || status === "inactive" || status === "maintenance") ? status : "active",
      });
    } else if (!isEditing) {
      // Reset form for create
      form.reset({
        name: "",
        domain: "",
        description: "",
        status: "active",
      });
    }
  }, [isEditing, website, isOpen, form]);

  const handleSubmit = async (data: FormData) => {
    if (!activeTenant?.id && !isEditing) {
      toast.error("No active tenant selected");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && website) {
        const result = await updateWebsite(website.id, {
          name: data.name.trim(),
          domain: data.domain.trim().toLowerCase(),
          description: data.description?.trim() || undefined,
          status: data.status,
        });

        if (result.success && result.data) {
          toast.success("Website updated successfully");
          onSuccess(result.data);
          onClose();
        } else {
          toast.error(result.error || "Failed to update website");
        }
      } else {
        const result = await createWebsite({
          tenant_id: activeTenant!.id,
          name: data.name.trim(),
          domain: data.domain.trim().toLowerCase(),
          description: data.description?.trim() || undefined,
          status: data.status,
        });

        if (result.success && result.data) {
          toast.success("Website created successfully");
          onSuccess(result.data);
          onClose();
        } else {
          toast.error(result.error || "Failed to create website");
        }
      }
    } catch (error) {
      toast.error(isEditing ? "Failed to update website" : "Failed to create website");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Website" : "Create New Website"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Corporate Website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Enter the domain name without http:// or https://
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of your website..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
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
                        <SelectItem value="active">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                            Inactive
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                            Maintenance
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Website" : "Create Website"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

