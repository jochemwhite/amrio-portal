"use client";

import { useState, useTransition } from "react";
import {
  CmsForm,
  setFormPublishedState,
  updateFormContent,
} from "@/actions/cms/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createUniqueFieldKey, fieldSupportsKey } from "./designer/field-helpers";
import { BuilderFieldPreview } from "./builder-field-preview";
import { BuilderField, HeadlessFormDesigner } from "./headless-form-designer";

const CONDITIONAL_LOGIC_OPERATORS = new Set([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "file_count_equals",
  "file_count_greater_than",
  "file_count_less_than",
  "file_size_less_than",
  "file_size_greater_than",
] as const);

interface FormBuilderEditorProps {
  form: CmsForm;
}

export function FormBuilderEditor({ form }: FormBuilderEditorProps) {
  const initialFieldKeys = (() => {
    if (!Array.isArray(form.content)) return {};
    return Object.fromEntries(
      (form.content as unknown[])
        .filter((entry): entry is { id?: unknown; key?: unknown } => Boolean(entry) && typeof entry === "object")
        .map((entry) => [String(entry.id ?? ""), entry.key ? String(entry.key) : undefined]),
    );
  })();

  const [content, setContent] = useState<BuilderField[]>(() => {
    if (Array.isArray(form.content)) {
      const fields = (form.content as unknown[]).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const field = entry as Partial<BuilderField>;
        if (!field.id || !field.type) return [];

        const supportsKey = fieldSupportsKey(field.type);
        if (supportsKey && !field.key) return [];

        return [
          {
            id: String(field.id),
            type: field.type,
            key: supportsKey ? String(field.key) : undefined,
            label: field.label ? String(field.label) : undefined,
            required: Boolean(field.required),
            placeholder: field.placeholder ? String(field.placeholder) : "",
            helpText: field.helpText ? String(field.helpText) : "",
            options: Array.isArray(field.options)
              ? field.options.map((option) => String(option))
              : undefined,
            defaultValue:
              typeof field.defaultValue === "string" ||
              typeof field.defaultValue === "number" ||
              typeof field.defaultValue === "boolean" ||
              Array.isArray(field.defaultValue)
                ? field.defaultValue
                : undefined,
            readOnly: Boolean(field.readOnly),
            hidden: Boolean(field.hidden),
            width:
              field.width === "half" || field.width === "third" || field.width === "full"
                ? field.width
                : supportsKey
                  ? "full"
                  : undefined,
            conditionalLogic:
              field.conditionalLogic && typeof field.conditionalLogic === "object"
                ? {
                    action: field.conditionalLogic.action === "hide" ? "hide" : "show",
                    match: field.conditionalLogic.match === "any" ? "any" : "all",
                    rules: Array.isArray(field.conditionalLogic.rules)
                      ? field.conditionalLogic.rules.flatMap((rule) => {
                          if (!rule || typeof rule !== "object" || !("field" in rule) || !("operator" in rule)) {
                            return [];
                          }

                          return [
                            {
                              field: String(rule.field),
                              operator: CONDITIONAL_LOGIC_OPERATORS.has(
                                String(rule.operator) as (typeof CONDITIONAL_LOGIC_OPERATORS extends Set<infer T> ? T : never),
                              )
                                ? (String(rule.operator) as NonNullable<BuilderField["conditionalLogic"]>["rules"][number]["operator"])
                                : "equals",
                              value:
                                "value" in rule &&
                                (typeof rule.value === "string" ||
                                  typeof rule.value === "number" ||
                                  typeof rule.value === "boolean")
                                  ? rule.value
                                  : undefined,
                            },
                          ];
                        })
                      : [],
                  }
                : undefined,
            min: typeof field.min === "number" ? field.min : undefined,
            max: typeof field.max === "number" ? field.max : undefined,
            step: typeof field.step === "number" ? field.step : undefined,
            minLength: typeof field.minLength === "number" ? field.minLength : undefined,
            maxLength: typeof field.maxLength === "number" ? field.maxLength : undefined,
            rows: typeof field.rows === "number" ? field.rows : undefined,
            prefix: field.prefix ? String(field.prefix) : undefined,
            suffix: field.suffix ? String(field.suffix) : undefined,
            autocomplete: field.autocomplete ? field.autocomplete : undefined,
            searchable: Boolean(field.searchable),
            minSelections: typeof field.minSelections === "number" ? field.minSelections : undefined,
            maxSelections: typeof field.maxSelections === "number" ? field.maxSelections : undefined,
            minDate: field.minDate ? String(field.minDate) : undefined,
            maxDate: field.maxDate ? String(field.maxDate) : undefined,
            disabledDates: Array.isArray(field.disabledDates)
              ? field.disabledDates.map((value) => String(value))
              : undefined,
            dateFormat: field.dateFormat ? String(field.dateFormat) : undefined,
            minTime: field.minTime ? String(field.minTime) : undefined,
            maxTime: field.maxTime ? String(field.maxTime) : undefined,
            timeStep: typeof field.timeStep === "number" ? field.timeStep : undefined,
            minRange: typeof field.minRange === "number" ? field.minRange : undefined,
            maxRange: typeof field.maxRange === "number" ? field.maxRange : undefined,
            checkedValue: field.checkedValue ? String(field.checkedValue) : undefined,
            uncheckedValue: field.uncheckedValue ? String(field.uncheckedValue) : undefined,
            accept: field.accept ? String(field.accept) : undefined,
            multiple: Boolean(field.multiple),
            maxFileSize: typeof field.maxFileSize === "number" ? field.maxFileSize : undefined,
            maxFiles: typeof field.maxFiles === "number" ? field.maxFiles : undefined,
            maxRating: typeof field.maxRating === "number" ? field.maxRating : undefined,
            ratingStep: typeof field.ratingStep === "number" ? field.ratingStep : undefined,
            ratingIcon: field.ratingIcon ? String(field.ratingIcon) : undefined,
            content: field.content ? String(field.content) : undefined,
            headingLevel: typeof field.headingLevel === "number" ? field.headingLevel : undefined,
            align:
              field.align === "center" || field.align === "right" || field.align === "left"
                ? field.align
                : undefined,
            markdown: Boolean(field.markdown),
            collapsible: Boolean(field.collapsible),
            collapsed: Boolean(field.collapsed),
          } satisfies BuilderField,
        ];
      });

      return fields.map((field) =>
        fieldSupportsKey(field.type)
          ? {
              ...field,
              key: createUniqueFieldKey(field.key ?? `${field.type}_field`, fields, field.id),
            }
          : field,
      );
    }
    return [];
  });
  const [isPublished, setIsPublished] = useState(form.published);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const saveContent = () => {
    startTransition(async () => {
      const result = await updateFormContent(form.id, {
        content,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save form content");
        return;
      }

      toast.success("Form structure saved");
    });
  };

  const togglePublish = () => {
    startTransition(async () => {
      const result = await setFormPublishedState(form.id, !isPublished);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to update publish state");
        return;
      }

      setIsPublished(result.data.published);
      toast.success(result.data.published ? "Form published" : "Form moved to draft");
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-1">
            <Link href="/dashboard/forms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <p className="truncate text-sm font-medium">
            <span className="text-muted-foreground">Form:</span> {form.name}
          </p>
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsPreviewOpen(true)} disabled={isPending} size="sm" variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveContent} disabled={isPending} size="sm" variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant={isPublished ? "outline" : "default"} onClick={togglePublish} disabled={isPending} size="sm">
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <HeadlessFormDesigner
        value={content}
        onChange={setContent}
        submissionsCount={form.submissions}
        initialFieldKeys={initialFieldKeys}
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>Interactive preview of your current builder structure.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto rounded-md border border-border bg-card p-3">
            {content.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fields yet.</p>
            ) : (
              content.map((field) => (
                <div key={field.id} className="rounded-md border border-border bg-background p-3">
                  <p className="mb-2 text-xs text-muted-foreground">{field.type}</p>
                  <BuilderFieldPreview field={field} />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
