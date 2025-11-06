"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ChevronDown, ChevronRight } from "lucide-react";
import { CollectionWithSchema } from "@/actions/cms/collection-actions";
import {
  CollectionEntryWithItems,
  saveCollectionEntryContent,
  updateCollectionEntry,
} from "@/actions/cms/collection-entry-actions";
import { toast } from "sonner";
import { FIELD_TYPES } from "../shared/field-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface CollectionEntryEditorProps {
  collection: CollectionWithSchema;
  entry: CollectionEntryWithItems;
  collectionId: string;
  entryId: string;
}

export function CollectionEntryEditor({
  collection,
  entry,
  collectionId,
  entryId,
}: CollectionEntryEditorProps) {
  const router = useRouter();
  const [entryName, setEntryName] = useState(entry.name || "");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize field values from entry items
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    entry.cms_collections_items?.forEach((item) => {
      initialValues[item.schema_field_id] = item.content;
    });
    setFieldValues(initialValues);
  }, [entry]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    setHasChanges(true);
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: any) => {
    if (field.required && !fieldValues[field.id]) {
      setErrors((prev) => ({ ...prev, [field.id]: "This field is required" }));
    }
  };

  const toggleNestedSection = (fieldId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    const allFields = collection.cms_schemas?.cms_schema_sections?.flatMap(
      (section) => section.cms_schema_fields || []
    ) || [];

    allFields.forEach((field: any) => {
      if (field.required && !fieldValues[field.id]) {
        newErrors[field.id] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      // Update entry name if changed
      if (entryName !== entry.name) {
        const nameResult = await updateCollectionEntry(entryId, { name: entryName });
        if (!nameResult.success) {
          toast.error(nameResult.error || "Failed to update entry name");
          setIsSaving(false);
          return;
        }
      }

      // Prepare field updates
      const updatedFields = Object.entries(fieldValues).map(([fieldId, content]) => {
        const item = entry.cms_collections_items?.find((i) => i.schema_field_id === fieldId);
        const field = collection.cms_schemas?.cms_schema_sections
          ?.flatMap((s) => s.cms_schema_fields || [])
          .find((f: any) => f.id === fieldId);

        return {
          id: fieldId,
          content,
          type: field?.type || "text",
          item_id: item?.id,
        };
      });

      const result = await saveCollectionEntryContent(entryId, updatedFields);

      if (result.success) {
        toast.success("Entry saved successfully");
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save entry");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: any, sectionId: string, allFields: any[] = []) => {
    // Skip rendering section-type fields as they're containers
    if (field.type === "section") {
      return renderNestedSection(field, sectionId, allFields);
    }

    const fieldType = FIELD_TYPES.find((ft) => ft.value === field.type);
    if (!fieldType?.cmsComponent) return null;

    const FieldComponent = fieldType.cmsComponent;
    const fieldId = `${sectionId}-${field.id}`;
    const value = fieldValues[field.id];
    const error = errors[field.id];

    return (
      <div key={field.id} className="mb-6">
        <FieldComponent
          field={field}
          fieldId={fieldId}
          value={value}
          error={error}
          handleFieldChange={handleFieldChange}
          handleFieldBlur={handleFieldBlur}
        />
      </div>
    );
  };

  const renderNestedSection = (parentField: any, sectionId: string, allFields: any[] = []) => {
    // Find all fields that belong to this nested section
    const nestedFields = allFields.filter((f: any) => f.parent_field_id === parentField.id);
    const isExpanded = expandedSections[parentField.id] ?? false;

    return (
      <div key={parentField.id} className="mb-6">
        <div className="border rounded-lg bg-muted/30">
          {/* Nested Section Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleNestedSection(parentField.id)}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNestedSection(parentField.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <h4 className="font-medium text-sm">{parentField.name}</h4>
              {parentField.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {nestedFields.length} field{nestedFields.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* Nested Section Content */}
          {isExpanded && nestedFields.length > 0 && (
            <div className="px-4 pb-4 space-y-4 border-t">
              <div className="pt-4 pl-4 border-l-2 border-muted-foreground/20 space-y-4">
                {nestedFields.map((nestedField: any) =>
                  renderField(nestedField, sectionId, allFields)
                )}
              </div>
            </div>
          )}

          {/* Empty state when expanded but no fields */}
          {isExpanded && nestedFields.length === 0 && (
            <div className="px-4 pb-4 border-t">
              <p className="text-sm text-muted-foreground text-center py-4">
                No fields in this nested section
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/dashboard/collections/${collectionId}/entries`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Entries
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Label htmlFor="entry-name">Entry Name</Label>
              <Input
                id="entry-name"
                value={entryName}
                onChange={(e) => {
                  setEntryName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Entry name"
                className="text-lg font-semibold mt-2"
              />
            </div>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Render sections and fields */}
        {collection.cms_schemas?.cms_schema_sections &&
        collection.cms_schemas.cms_schema_sections.length > 0 ? (
          <div className="space-y-6">
            {collection.cms_schemas.cms_schema_sections.map((section: any) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>{section.name}</CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.cms_schema_fields && section.cms_schema_fields.length > 0 ? (
                    section.cms_schema_fields
                      .filter((field: any) => !field.parent_field_id) // Only render top-level fields
                      .map((field: any) =>
                        renderField(field, section.id, section.cms_schema_fields)
                      )
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No fields in this section
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">
                  No schema defined for this collection.
                </p>
                <Link href={`/dashboard/collections/${collectionId}`}>
                  <Button variant="outline" className="mt-4">
                    Edit Collection Schema
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

