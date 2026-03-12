"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldType } from "@/types/cms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import * as z from "zod";
import { Search } from "lucide-react";
import CollectionPicker from "./CollectionPicker";
import { FIELD_TYPES } from "../field-types";
import { useSchemaBuilderStore } from "@/stores/schema-editor-store";

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
  required: z.boolean(),
  default_value: z.string().optional(),
  validation: z.string().optional(),
  settings: z.record(z.string(), z.any()).nullable().optional(),
  collection_id: z.string().nullable(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

export function AddFieldMenu() {
  const {
    isAddFieldOpen,
    isEditFieldOpen,
    setFieldFormData,
    submitField,
    closeFieldDialog,
    fieldFormData,
    editingFieldId,
  } = useSchemaBuilderStore(
    useShallow((state) => ({
      isAddFieldOpen: state.isAddFieldOpen,
      isEditFieldOpen: state.isEditFieldOpen,
      setFieldFormData: state.setFieldFormData,
      submitField: state.submitField,
      closeFieldDialog: state.closeFieldDialog,
      fieldFormData: state.fieldFormData,
      editingFieldId: state.editingFieldId,
    }))
  );

  const isEditMode = !!editingFieldId;
  const isDialogOpen = isAddFieldOpen || isEditFieldOpen;
  const [selectedType, setSelectedType] = useState<string | null>(fieldFormData.type || null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastEditingFieldId, setLastEditingFieldId] = useState<string | null>(null);

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: fieldFormData.name,
      field_key: fieldFormData.field_key,
      type: fieldFormData.type,
      required: fieldFormData.required ?? false,
      default_value: fieldFormData.default_value,
      validation: fieldFormData.validation,
      settings: fieldFormData.settings,
      collection_id: fieldFormData.collection_id,
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
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
      setSearchQuery("");
      setHasInitialized(false);
      setLastEditingFieldId(null);
    }
  }, [isDialogOpen, editingFieldId]);

  const filteredFieldTypes = useMemo(() => {
    if (!searchQuery.trim()) return FIELD_TYPES;
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
    form.setValue("settings", null);
  };

  const handleBackToTypeSelection = () => {
    setSelectedType(null);
    form.reset();
    setSearchQuery("");
  };

  const onSubmit = (data: FieldFormData) => {
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
      <SheetContent className="sm:max-w-[600px] overflow-y-auto px-4">
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
          /* ── Type picker ── */
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
          /* ── Field config form ── */
          <form id="add-field-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
            <FieldGroup>
              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-field-name">Field Name *</FieldLabel>
                    <Input
                      {...field}
                      id="add-field-name"
                      placeholder="Enter field name"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      The display name for this field (e.g., "Hero Title", "CTA Button")
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Field Key */}
              <Controller
                name="field_key"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-field-key">Field Key *</FieldLabel>
                    <Input
                      {...field}
                      id="add-field-key"
                      placeholder="e.g., hero_title, cta_button"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Unique programmatic identifier (snake_case). Used in code to access this field.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Required toggle */}
              <Controller
                name="required"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="horizontal">
                    <div className="space-y-0.5">
                      <FieldLabel htmlFor="add-field-required">Required Field</FieldLabel>
                      <FieldDescription>Make this field mandatory for content creation</FieldDescription>
                    </div>
                    <Switch
                      id="add-field-required"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />

              {/* Default value */}
              {selectedType !== "boolean" && selectedType !== "reference" && selectedType !== "social_media" && (
                <Controller
                  name="default_value"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-field-default">Default Value</FieldLabel>
                      <Input
                        {...field}
                        id="add-field-default"
                        placeholder="Enter default value (optional)"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        The default value that will be pre-filled for this field
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {/* Reference collection picker */}
              {selectedType === "reference" && (
                <Controller
                  name="collection_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-field-collection">Reference Collection</FieldLabel>
                      <CollectionPicker
                        collectionId={field.value}
                        setCollectionId={field.onChange}
                      />
                      <FieldDescription>The ID of the collection to reference</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {/* Settings component or validation textarea */}
              {selectedType && FIELD_TYPES.find((t) => t.value === selectedType)?.settingsComponent ? (
                <Controller
                  name="settings"
                  control={form.control}
                  render={({ field }) => {
                    const SettingsComponent = FIELD_TYPES.find((t) => t.value === selectedType)?.settingsComponent;
                    if (!SettingsComponent) return <div />;
                    return <SettingsComponent value={field.value || null} setValue={field.onChange} />;
                  }}
                />
              ) : (
                <Controller
                  name="validation"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-field-validation">Validation Rules</FieldLabel>
                      <Textarea
                        {...field}
                        id="add-field-validation"
                        placeholder="Enter validation rules (optional)"
                        rows={3}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Custom validation rules or constraints for this field
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}
            </FieldGroup>

            <Field orientation="horizontal" className="mt-6 pt-4 border-t">
              {!isEditMode && (
                <Button type="button" variant="ghost" onClick={handleBackToTypeSelection}>
                  ← Back to Field Types
                </Button>
              )}
              <div className={`flex space-x-3 ${isEditMode ? "ml-auto" : ""}`}>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" form="add-field-form">
                  {isEditMode ? "Update Field" : "Add Field"}
                </Button>
              </div>
            </Field>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}