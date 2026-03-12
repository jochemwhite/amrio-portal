"use client";
import { Label } from "@/components/ui/label";
import RichTextEditorComponent from "@/components/rich-editor/tiptap";
import React, { useEffect } from "react";
import { FieldComponentProps, useContentEditorStore } from "@/stores/content-editor-store";

export default function RichText({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const { getFieldValue } = useContentEditorStore();
  const handleChange = (json: unknown) => {
    handleFieldChange(field.id, json);
  };



  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RichTextEditorComponent initialValue={value} onChange={handleChange} />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}
