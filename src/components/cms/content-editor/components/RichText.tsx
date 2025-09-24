"use client";
import { Label } from "@/components/ui/label";
import RichTextEditorComponent from "@/components/rich-editor/tiptap";
import React from "react";

export default function RichText({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  const editorValue = React.useMemo(() => {
    if (!value) return null;

    // If it's already a JSON object (Tiptap format), use as is
    if (typeof value === "object" && value.type) {
      return value;
    }

    // If it's a string, convert to basic Tiptap JSON format
    if (typeof value === "string") {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: value,
              },
            ],
          },
        ],
      };
    }

    return null;
  }, [value]);

  const handleEditorChange = (json: any) => {
    handleFieldChange(field.id, json);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RichTextEditorComponent />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
