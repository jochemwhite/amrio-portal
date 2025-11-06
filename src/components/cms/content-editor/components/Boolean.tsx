import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import React from "react";

export default function Boolean({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.name}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Switch id={fieldId} checked={value || false} onCheckedChange={(checked) => handleFieldChange(field.id, checked)} />
      </div>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
