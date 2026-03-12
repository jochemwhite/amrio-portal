import { getPagesByWebsiteId } from "@/actions/cms/page-actions";
import { SocialIcon } from "@/components/global/renderIcon";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSession } from "@/providers/session-provider";
import { FieldComponentProps } from "@/stores/content-editor-store";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const ICON_OPTIONS = [
  "facebook", "instagram", "x", "tiktok", "snapchat", "reddit", "linkedin",
  "whatsapp", "telegram", "discord", "slack", "messenger",
  "youtube", "twitch",
  "github",
  "spotify", "apple", "google", "microsoft", "amazon", "paypal",
] as const;

const formSchema = z.object({
  label:       z.string().min(1, "Label is required"),
  href:        z.string(),
  target:      z.enum(["_self", "_blank"]),
  download:    z.boolean(),
  custom_href: z.string().optional().nullable(),
  icon:        z.enum([...ICON_OPTIONS, "none"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ButtonComponent({ field, value, handleFieldChange }: FieldComponentProps) {
  const [pages, setPages]     = useState<Database["public"]["Tables"]["cms_pages"]["Row"][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { userSession } = useUserSession();
  const websiteId = userSession?.active_website?.id;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      href:        value?.href        ?? "",
      label:       value?.label       ?? "",
      target:      value?.target      ?? "_self",
      download:    value?.download    ?? false,
      custom_href: value?.custom_href ?? undefined,
      icon:        value?.icon        ?? undefined,
    },
    mode: "onChange",
  });

  const { control, watch } = form;

  // Sync changes to CMS store
  useEffect(() => {
    const sub = watch((vals) => {
      if (typeof handleFieldChange === "function") {
        handleFieldChange(field.id, vals);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, field.id, handleFieldChange]);

  // Fetch pages for active website
  useEffect(() => {
    if (!websiteId) return;
    setLoading(true);
    getPagesByWebsiteId(websiteId).then(({ success, data, error }) => {
      if (!success) setError(error ?? "Failed to get pages");
      if (data) setPages(data);
      setLoading(false);
    });
  }, [websiteId]);

  // Clear custom_href when href changes away from custom_link
  useEffect(() => {
    if (watch("href") !== "custom_link" && watch("custom_href")) {
      form.setValue("custom_href", undefined);
    }
  }, [watch("href")]);

  return (
    <div>
      <Label className="px-1">Button</Label>

      <form className="space-y-4 mt-2">
        <FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Label */}
            <Controller
              name="label"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="label">Label *</FieldLabel>
                  <Input
                    {...field}
                    id="label"
                    placeholder="Button text"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            {/* Href */}
            <Controller
              name="href"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="href">Href (URL)</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="href" disabled={loading} className="h-10">
                      <SelectValue placeholder={loading ? "Loading..." : "Select a page"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Pages</SelectLabel>
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={page.slug}>
                            {page.slug}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom_link">Other Link</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            {/* Target */}
            <Controller
              name="target"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="target">Target</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="target" className="h-10">
                      <SelectValue placeholder="Select a target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Targets</SelectLabel>
                        <SelectItem value="_self">Current tab</SelectItem>
                        <SelectItem value="_blank">New Tab</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
          </div>

          {/* Custom href */}
          {watch("href") === "custom_link" && (
            <Controller
              name="custom_href"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="custom_href">Custom Link</FieldLabel>
                  <Input
                    {...field}
                    id="custom_href"
                    placeholder="https://google.com"
                    value={field.value || ""}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
          )}

          {/* Icon */}
          <Controller
            name="icon"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="icon">Icon</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                  value={field.value && field.value !== "none" ? field.value : ""}
                >
                  <SelectTrigger id="icon" className="h-10">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Icons</SelectLabel>
                      <SelectItem value="none">None</SelectItem>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <span className="flex gap-3 items-center">
                            <SocialIcon icon={icon} />
                            {icon.charAt(0).toUpperCase() + icon.slice(1)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </div>
  );
}