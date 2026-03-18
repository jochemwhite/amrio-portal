import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldComponentProps } from "@/stores/content-editor-store";
import React, { useEffect } from "react";

export default function Text({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        value={value || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        placeholder={field.default_value || `Enter ${field.name.toLowerCase()}`}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
