"use client";

import { Label } from "@/components/ui/label";
import { FieldComponentProps } from "@/stores/content-editor-store";
import { getRichTextAllowedNodesFromSettings } from "@/utils/schema/rich_text_nodes";
import { RichTextEditor } from "./rich-text";

export default function RichText({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const allowedNodes = getRichTextAllowedNodesFromSettings(field.settings)

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RichTextEditor
        value={value}
        onChange={(json) => handleFieldChange(field.id, json)}
        allowedNodes={allowedNodes}
        placeholder={field.description || "Start typing..."}
        fieldName={field.name}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
