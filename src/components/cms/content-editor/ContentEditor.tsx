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

  // Render field input based on type
  const renderFieldInput = (field: any) => {
    const value = getFieldValue(field.id);
    const error = validationErrors[field.id];
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.default_value || `Enter ${field.name.toLowerCase()}`}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'richtext':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RichTextEditor
              value={value}
              onChange={(json) => handleFieldChange(field.id, json)}
              placeholder={field.default_value || `Enter ${field.name.toLowerCase()}`}
              error={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.valueAsNumber || e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.default_value || '0'}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-normal">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground ml-2">{field.description}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={fieldId}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground",
                    error && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => handleFieldChange(field.id, date?.toISOString().split('T')[0])}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // In a real app, you'd upload this to your storage service
                  // For now, just store the file name
                  handleFieldChange(field.id, file.name);
                }
              }}
              onBlur={() => handleFieldBlur(field)}
              className={error ? "border-destructive" : ""}
            />
            {value && (
              <p className="text-sm text-muted-foreground">Selected: {value}</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.default_value || `Enter ${field.name.toLowerCase()}`}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
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
        {sections.map((section: any) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.name}</CardTitle>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.cms_fields?.length > 0 ? (
                section.cms_fields.map((field: any) => (
                  <div key={field.id}>
                    {renderFieldInput(field)}
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