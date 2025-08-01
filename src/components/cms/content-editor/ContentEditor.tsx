"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useContentEditorStore } from "@/stores/useContentEditorStore";
import { usePageBuilderStore } from "@/stores/usePageBuilderStore";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import RenderComponent from "./RenderComponent";

interface ContentEditorProps {
  pageId: string;
}

export function ContentEditor({ pageId }: ContentEditorProps) {
  const { sections } = usePageBuilderStore();
  const {
    hasUnsavedChanges,
    isSaving,
    isLoading,
    initializeContent,
    setFieldValue,
    getFieldValue,
    saveContent,
    resetAllFields,
    validateField,
  } = useContentEditorStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize content editor when component mounts
  useEffect(() => {
    initializeContent(pageId);
  }, [pageId, initializeContent]);

  // Validate field on blur
  const handleFieldBlur = (field: any) => {
    const error = validateField(field.id, field);
    setValidationErrors(prev => ({
      ...prev,
      [field.id]: error || '',
    }));
  };

  // Handle field value changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValue(fieldId, value);
    // Clear validation error when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: '',
      }));
    }
  };


 

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          No schema defined yet. Switch to Schema Builder mode to create fields first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Content Editor</h2>
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={resetAllFields}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={saveContent}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </div>

      {/* Content Form */}
      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.name}</CardTitle>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.cms_fields?.length > 0 ? (
                section.cms_fields.map((field) => (
                  <div key={field.id}>
                    <RenderComponent field={field} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No fields defined in this section
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 