import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

export default function Reference({ field, fieldId, value, error, handleFieldChange, handleFieldBlur }: any) {
  // In a real app, you'd fetch the available references based on field.reference_table
  const mockReferences = [
    { id: "1", title: "Sample Reference 1" },
    { id: "2", title: "Sample Reference 2" },
    { id: "3", title: "Sample Reference 3" },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <Select
        value={value || ""}
        onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
        onOpenChange={() => handleFieldBlur(field)}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select a reference..." />
        </SelectTrigger>
        <SelectContent>
          {mockReferences.map((ref) => (
            <SelectItem key={ref.id} value={ref.id}>
              {ref.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}