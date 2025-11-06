import { getPagesByWebsiteId } from "@/actions/cms/page-actions";
import { SocialIcon } from "@/components/global/renderIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveWebsite } from "@/hooks/use-active-website";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ICON_OPTIONS = [
  // Social Media
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "snapchat",
  "reddit",
  "linkedin",
  // Messaging
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "messenger",
  // Video/Streaming
  "youtube",
  "twitch",
  // Professional/Dev
  "github",
  // Other
  "spotify",
  "apple",
  "google",
  "microsoft",
  "amazon",
  "paypal",
] as const;

const formSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string(),
  target: z.enum(["_self", "_blank"]).default("_self"),
  download: z.boolean().optional().default(false),
  custom_href: z.string().optional().nullable(),
  icon: z.enum([...ICON_OPTIONS, "none"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ButtonComponent({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const [pages, setPages] = useState<Database["public"]["Tables"]["cms_pages"]["Row"][]>([]);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState<boolean>();
  const { activeWebsite } = useActiveWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      href: value?.href ?? false,
      label: value?.label ?? "",
      target: value?.target ?? "_self",
      custom_href: value?.custom_href ?? undefined,
      icon: value?.icon ?? undefined,
    },
    mode: "onChange",
  });

  const { control, watch, handleSubmit, setValue } = form;

  // Watch for changes and update CMS store
  useEffect(() => {
    const sub = watch((vals) => {
      if (typeof handleFieldChange === "function") {
        handleFieldChange(field.id, vals);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, field.id, handleFieldChange]);

  // fetch all pages
  useEffect(() => {
    setLoading(true);
    const fetchPages = async () => {
      if (!activeWebsite || !activeWebsite.id) {
        return;
      }
      const { success, data, error } = await getPagesByWebsiteId(activeWebsite.id);
      if (!success) {
        if (error) {
          setError(error);
        } else {
          setError("Failed to get pages");
        }
      }

      if (data) setPages(data);

      setLoading(false);
    };

    fetchPages();
  }, [activeWebsite]);

  useEffect(() => {
    if (form.watch("href") !== "custom_link" && form.watch("custom_href")) {
      form.setValue("custom_href", undefined);
    }
  }, [form.watch("href")]);

  return (
    <div className="">
      <Label className="px-1">Button</Label>

      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FormField
              name="label"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="Button text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormField
                name="href"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Href (URL)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger disabled={loading} className="h-10">
                          <SelectValue placeholder={loading ? "Loading..." : "Select a page"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Pages</SelectLabel>
                            {pages.map((page, _) => (
                              <SelectItem key={_} value={page.slug}>
                                {page.slug}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom_link">Other Link</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("href") === "custom_link" && (
                <FormField
                  name="custom_href"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://google.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              name="target"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10">
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="icon"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(undefined);
                          return;
                        }
                        field.onChange(value);
                      }}
                      value={field.value && field.value !== "none" ? field.value : ""}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Icons</SelectLabel>
                          <SelectItem value="none">None</SelectItem>
                          {ICON_OPTIONS.map((icon, _) => (
                            <SelectItem key={_} value={icon}>
                              <span className="flex gap-3">
                                <SocialIcon icon={icon} /> {icon.charAt(0).toUpperCase() + icon.slice(1)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              name="download"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download </FormLabel>
                  <FormControl>
                    <div className="h-9 flex items-center justify-center">
                      <Checkbox onCheckedChange={field.onChange} checked={field.value} className="ml-4 " />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </div>
        </form>
      </Form>
    </div>
  );
}
