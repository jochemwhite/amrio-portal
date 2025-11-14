"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSchemaBuilderStore } from "@/stores/useSchemaBuilderStore";
import { FieldType } from "@/types/cms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Search } from "lucide-react";
import { FIELD_TYPES } from "../shared/field-types";
import CollectionPicker from "./CollectionPicker";

// Form validation schema
const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .min(2, "Field name must be at least 2 characters")
    .max(50, "Field name must be less than 50 characters"),

  field_key: z
    .string()
    .min(1, "Field key is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Field key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores")
    .max(50, "Field key must be less than 50 characters"),

  type: z.string().min(1, "Field type is required"),
  required: z.boolean().default(false),
  default_value: z.string().optional(),
  validation: z.string().optional(),
  settings: z.record(z.any()).nullable().optional(),
  collection_id: z.string().nullable(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface AddFieldMenuProps {

}

export function AddFieldMenu() {
  // Use explicit selectors to ensure proper re-renders on state changes
  const isAddFieldOpen = useSchemaBuilderStore((state) => state.isAddFieldOpen);
  const isEditFieldOpen = useSchemaBuilderStore((state) => state.isEditFieldOpen);
  const setFieldFormData = useSchemaBuilderStore((state) => state.setFieldFormData);
  const submitField = useSchemaBuilderStore((state) => state.submitField);
  const closeFieldDialog = useSchemaBuilderStore((state) => state.closeFieldDialog);
  const fieldFormData = useSchemaBuilderStore((state) => state.fieldFormData);
  const editingFieldId = useSchemaBuilderStore((state) => state.editingFieldId);
  
  const isEditMode = !!editingFieldId;
  const isDialogOpen = isAddFieldOpen || isEditFieldOpen; // Check both states
  const [selectedType, setSelectedType] = useState<string | null>(fieldFormData.type || null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
      defaultValues: {
        name: fieldFormData.name,
        field_key: fieldFormData.field_key,
        type: fieldFormData.type,
        required: fieldFormData.required,
        default_value: fieldFormData.default_value,
        validation: fieldFormData.validation,
        settings: fieldFormData.settings,
        collection_id: fieldFormData.collection_id,
      },
  });


  // Track the last editingFieldId to detect field changes
  const [lastEditingFieldId, setLastEditingFieldId] = useState<string | null>(null);

  // Update form when dialog opens or when editing a different field (important for edit mode)
  useEffect(() => {
    if (isDialogOpen) {
      // Only reset form when dialog first opens or when switching to a different field
      const isDifferentField = editingFieldId !== lastEditingFieldId;
      if (!hasInitialized || isDifferentField) {
        form.reset({
          name: fieldFormData.name,
          field_key: fieldFormData.field_key,
          type: fieldFormData.type,
          required: fieldFormData.required,
          default_value: fieldFormData.default_value,
          validation: fieldFormData.validation,
          settings: fieldFormData.settings,
          collection_id: fieldFormData.collection_id,
        });
        setSelectedType(fieldFormData.type || null);
        setHasInitialized(true);
        setLastEditingFieldId(editingFieldId);
      }
    } else {
      // Reset when dialog closes
      setSearchQuery("");
      setHasInitialized(false);
      setLastEditingFieldId(null);
    }
  }, [isDialogOpen, editingFieldId]); // Only reset when dialog opens/closes or field ID changes

  // Filter field types based on search query
  const filteredFieldTypes = useMemo(() => {
    if (!searchQuery.trim()) {
      return FIELD_TYPES;
    }
    const query = searchQuery.toLowerCase();
    return FIELD_TYPES.filter(
      (type) =>
        type.label.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        type.value.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleTypeSelect = (type: FieldType) => {
    setSelectedType(type.value);
    form.setValue("type", type.value);
    // Reset settings when changing field type
    form.setValue("settings", null);
  };

  const handleBackToTypeSelection = () => {
    setSelectedType(null);
    form.reset();
    setSearchQuery("");
  };

  const onSubmit = (data: FieldFormData) => {
    // Ensure settings are preserved - use form's current value if data.settings is null/undefined
    const currentSettings = form.getValues("settings");
    const settingsValue = data.settings !== undefined && data.settings !== null ? data.settings : currentSettings;
    
    setFieldFormData({
      name: data.name,
      field_key: data.field_key,
      type: data.type,
      required: data.required,
      default_value: data.default_value || "",
      validation: data.validation || "",
      settings: settingsValue || null,
      collection_id: data.collection_id || null,
    });
    submitField();
    handleCancel();
  };

  const handleCancel = () => {
    form.reset();
    setSelectedType(null);
    closeFieldDialog();
  };

  return (
    <Sheet open={isDialogOpen} onOpenChange={handleCancel}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditMode
              ? `Edit ${FIELD_TYPES.find((t) => t.value === selectedType)?.label} Field`
              : !selectedType
                ? "Add New Field"
                : `Add ${FIELD_TYPES.find((t) => t.value === selectedType)?.label} Field`}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update your field properties and validation rules"
              : !selectedType
                ? "Choose a field type to get started"
                : "Configure your field properties and validation rules"}
          </SheetDescription>
        </SheetHeader>

        {!selectedType && !isEditMode ? (
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search field types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredFieldTypes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredFieldTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    onClick={() => handleTypeSelect(type)}
                    className="flex items-center justify-start space-x-3 p-4 h-auto text-left"
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No field types found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter field name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for this field (e.g., "Hero Title", "CTA Button")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="field_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Key *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., hero_title, cta_button" 
                        {...field}
                        onChange={(e) => {
                          // Auto-convert to lowercase and replace spaces with underscores
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique programmatic identifier (snake_case). Used in code to access this field.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Field</FormLabel>
                      <FormDescription>Make this field mandatory for content creation</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {selectedType !== "boolean" && selectedType !== "reference" && selectedType !== "social_media" && (
                <FormField
                  control={form.control}
                  name="default_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter default value (optional)" {...field} />
                      </FormControl>
                      <FormDescription>The default value that will be pre-filled for this field</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "reference" && (
                <FormField
                  control={form.control}
                  name="collection_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Collection</FormLabel>
                      <FormControl>
                        <CollectionPicker collectionId={field.value} setCollectionId={field.onChange} />
                      </FormControl>
                      <FormDescription>The ID of the collection to reference</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType && FIELD_TYPES.find((t) => t.value === selectedType)?.settingsComponent ? (
                <FormField
                  control={form.control}
                  name="settings"
                  render={({ field }) => {
                    const SettingsComponent = FIELD_TYPES.find((t) => t.value === selectedType)?.settingsComponent;
                    if (!SettingsComponent) {
                      return <div />;
                    }
                    return (
                      <SettingsComponent
                        value={field.value || null}
                        setValue={field.onChange}
                      />
                    );
                  }}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="validation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validation Rules</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter validation rules (optional)" rows={3} {...field} />
                      </FormControl>
                      <FormDescription>Custom validation rules or constraints for this field</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-between pt-4">
                {!isEditMode && (
                  <Button type="button" variant="ghost" onClick={handleBackToTypeSelection}>
                    ← Back to Field Types
                  </Button>
                )}
                <div className={`flex space-x-3 ${isEditMode ? "ml-auto" : ""}`}>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">{isEditMode ? "Update Field" : "Add Field"}</Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
