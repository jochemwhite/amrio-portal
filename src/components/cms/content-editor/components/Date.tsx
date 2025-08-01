import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

export default function Date({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        type="date"
        value={value || ""}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        onBlur={() => handleFieldBlur(field)}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}