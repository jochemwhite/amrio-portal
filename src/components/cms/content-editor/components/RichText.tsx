import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

export default function RichText({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={fieldId}
        value={value || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        onBlur={() => handleFieldBlur(field)}
        placeholder={field.default_value || `Enter ${field.name.toLowerCase()}`}
        className={error ? "border-destructive" : ""}
        rows={6}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}