"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FIELD_TYPES } from "@/utils/schema/field_types"

export type FieldSheetValues = {
  label: string
  fieldKey: string
  databaseType: string
  required: boolean
  defaultValue: string
  validation: string
  settings: Record<string, unknown> | null
  collectionId: string | null
}

type FieldSheetProps = {
  mode: "add" | "edit"
  open: boolean
  initialValues: FieldSheetValues
  onClose: () => void
  onSubmit: (values: FieldSheetValues) => void
}

export function FieldSheet({ mode, open, initialValues, onClose, onSubmit }: FieldSheetProps) {
  const [selectedType, setSelectedType] = useState(initialValues.databaseType || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [formValues, setFormValues] = useState<FieldSheetValues>(initialValues)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [touched, setTouched] = useState<{
    label: boolean
    fieldKey: boolean
    collectionId: boolean
  }>({
    label: false,
    fieldKey: false,
    collectionId: false,
  })

  const filteredFieldTypes = useMemo(() => {
    if (!searchQuery.trim()) {
      return FIELD_TYPES
    }

    const query = searchQuery.toLowerCase()
    return FIELD_TYPES.filter(
      (type) =>
        type.label.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        type.value.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const isTypePickerVisible = mode === "add" && !selectedType
  const selectedFieldType = FIELD_TYPES.find((type) => type.value === selectedType)
  const SettingsComponent = selectedFieldType?.settingsComponent
  const collectionError =
    selectedType === "reference" && !formValues.collectionId ? "Please select a collection." : null
  const labelError = validate_label(formValues.label)
  const fieldKeyError = validate_field_key(formValues.fieldKey)
  const canSubmit = !labelError && !fieldKeyError && !collectionError && Boolean(selectedType)
  const showLabelError = Boolean(labelError) && (hasTriedSubmit || touched.label)
  const showFieldKeyError = Boolean(fieldKeyError) && (hasTriedSubmit || touched.fieldKey)
  const showCollectionError = Boolean(collectionError) && (hasTriedSubmit || touched.collectionId)

  function handle_type_select(type: string) {
    setSelectedType(type)
    setHasTriedSubmit(false)
    setTouched({
      label: false,
      fieldKey: false,
      collectionId: false,
    })
    setFormValues((current) => ({
      ...current,
      databaseType: type,
    }))
  }

  function handle_submit() {
    setHasTriedSubmit(true)
    if (!canSubmit) {
      return
    }

    onSubmit({
      ...formValues,
      databaseType: selectedType,
    })
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <SheetContent className="overflow-y-auto px-4 sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Field" : selectedType ? "Add Field" : "Add New Field"}</SheetTitle>
          <SheetDescription>
            {isTypePickerVisible
              ? "Choose a field type to get started."
              : "Configure your field properties."}
          </SheetDescription>
        </SheetHeader>

        {isTypePickerVisible ? (
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search field types..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredFieldTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  onClick={() => handle_type_select(type.value)}
                  className="flex h-auto items-center justify-start gap-3 p-4 text-left"
                >
                  <span className="text-lg">{type.icon}</span>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Field Name *</label>
              <Input
                value={formValues.label}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                onBlur={() =>
                  setTouched((current) => ({
                    ...current,
                    label: true,
                  }))
                }
                placeholder="Field name"
                aria-invalid={showLabelError}
              />
              {showLabelError ? <p className="text-xs text-rose-400">{labelError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Field Key *</label>
              <Input
                value={formValues.fieldKey}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    fieldKey: event.target.value,
                  }))
                }
                onBlur={() =>
                  setTouched((current) => ({
                    ...current,
                    fieldKey: true,
                  }))
                }
                placeholder="field_key"
                aria-invalid={showFieldKeyError}
              />
              {showFieldKeyError ? <p className="text-xs text-rose-400">{fieldKeyError}</p> : null}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              <div>
                <p className="text-sm font-medium">Required Field</p>
                <p className="text-xs text-muted-foreground">Make this field mandatory</p>
              </div>
              <Switch
                checked={formValues.required}
                onCheckedChange={(required) =>
                  setFormValues((current) => ({
                    ...current,
                    required,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Default Value</label>
              <Input
                value={formValues.defaultValue}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    defaultValue: event.target.value,
                  }))
                }
                placeholder="Optional default value"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{SettingsComponent ? "Field Settings" : "Validation Rules"}</label>
              {SettingsComponent ? (
                <SettingsComponent
                  value={formValues.settings}
                  setValue={(settings) =>
                    setFormValues((current) => ({
                      ...current,
                      settings,
                    }))
                  }
                  open={open}
                  collectionId={formValues.collectionId}
                  setCollectionId={(collectionId) =>
                    setFormValues((current) => ({
                      ...current,
                      collectionId,
                    }))
                  }
                  error={showCollectionError ? collectionError : null}
                  onCollectionTouched={() =>
                    setTouched((current) => ({
                      ...current,
                      collectionId: true,
                    }))
                  }
                />
              ) : (
                <Textarea
                  value={formValues.validation}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      validation: event.target.value,
                    }))
                  }
                  placeholder="Optional validation rules"
                  rows={3}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
              {mode === "add" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedType("")
                    setSearchQuery("")
                    setHasTriedSubmit(false)
                    setTouched({
                      label: false,
                      fieldKey: false,
                      collectionId: false,
                    })
                  }}
                >
                  Back
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handle_submit} disabled={!canSubmit && hasTriedSubmit}>
                {mode === "edit" ? "Update Field" : "Add Field"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function validate_label(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return "Field name is required."
  }

  if (normalized.length < 2) {
    return "Field name must be at least 2 characters."
  }

  if (normalized.length > 50) {
    return "Field name must be at most 50 characters."
  }

  return null
}

function validate_field_key(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return "Field key is required."
  }

  if (!/^[a-z][a-z0-9_]*$/.test(normalized)) {
    return "Field key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores."
  }

  if (normalized.length > 50) {
    return "Field key must be at most 50 characters."
  }

  return null
}
