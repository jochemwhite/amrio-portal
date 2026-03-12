import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import React from "react";

export default function YoutubeVideo({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  return (
    <div>
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        type="text"
        value={value || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
