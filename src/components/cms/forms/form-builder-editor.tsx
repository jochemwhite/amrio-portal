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
import { BuilderField, HeadlessFormDesigner } from "./headless-form-designer";

interface FormBuilderEditorProps {
  form: CmsForm;
}

export function FormBuilderEditor({ form }: FormBuilderEditorProps) {
  const [content, setContent] = useState<BuilderField[]>(() => {
    if (Array.isArray(form.content)) {
      return (form.content as unknown[]).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const field = entry as Partial<BuilderField>;
        if (!field.id || !field.type || !field.key || !field.label) return [];
        return [
          {
            id: String(field.id),
            type: field.type,
            key: String(field.key),
            label: String(field.label),
            required: Boolean(field.required),
            placeholder: field.placeholder ? String(field.placeholder) : "",
            helpText: field.helpText ? String(field.helpText) : "",
            options: Array.isArray(field.options)
              ? field.options.map((option) => String(option))
              : undefined,
            min: typeof field.min === "number" ? field.min : undefined,
            max: typeof field.max === "number" ? field.max : undefined,
            step: typeof field.step === "number" ? field.step : undefined,
            minDate: field.minDate ? String(field.minDate) : undefined,
            maxDate: field.maxDate ? String(field.maxDate) : undefined,
            checkedValue: field.checkedValue ? String(field.checkedValue) : undefined,
            uncheckedValue: field.uncheckedValue ? String(field.uncheckedValue) : undefined,
          } satisfies BuilderField,
        ];
      });
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

      <HeadlessFormDesigner value={content} onChange={setContent} />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>Read-only preview of your current builder structure.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto rounded-md border border-border bg-card p-3">
            {content.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fields yet.</p>
            ) : (
              content.map((field) => (
                <div key={field.id} className="rounded-md border border-border bg-background p-3">
                  <p className="text-sm font-medium">
                    {field.label}
                    {field.required ? "*" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">{field.type}</p>
                  {field.type === "textarea" ? (
                    <textarea
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      placeholder={field.placeholder || "Value here..."}
                      readOnly
                    />
                  ) : field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" readOnly />
                      {field.label}
                    </label>
                  ) : field.type === "select" ? (
                    <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" disabled>
                      <option>{field.placeholder || "Select..."}</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      placeholder={field.placeholder || "Value here..."}
                      readOnly
                    />
                  )}
                  {field.helpText ? <p className="mt-2 text-xs text-muted-foreground">{field.helpText}</p> : null}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
