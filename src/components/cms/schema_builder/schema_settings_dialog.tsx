"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type SchemaSettingsValues = {
  title: string
  description: string
  isTemplate: boolean
}

type SchemaSettingsDialogProps = {
  isSaving?: boolean
  open: boolean
  initialValues: SchemaSettingsValues
  onClose: () => void
  onConvertToTemplate: () => void
  onSubmit: (values: SchemaSettingsValues) => void
}

export function SchemaSettingsDialog({
  isSaving = false,
  open,
  initialValues,
  onClose,
  onConvertToTemplate,
  onSubmit,
}: SchemaSettingsDialogProps) {
  const [values, setValues] = useState<SchemaSettingsValues>(initialValues)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const titleError = values.title.trim() ? null : "Schema name is required."

  function handle_submit() {
    setHasTriedSubmit(true)
    if (titleError) {
      return
    }

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schema Settings</DialogTitle>
          <DialogDescription>Update schema title and description.</DialogDescription>
        </DialogHeader>

        {!values.isTemplate ? (
          <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-100">
              This schema is currently not a template.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              disabled={isSaving}
              onClick={onConvertToTemplate}
            >
              Convert to Template
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            This schema is already a template.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Schema Name *</label>
            <Input
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Schema name"
              aria-invalid={Boolean(titleError) && hasTriedSubmit}
            />
            {titleError && hasTriedSubmit ? <p className="text-xs text-rose-400">{titleError}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              rows={3}
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional schema description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handle_submit} disabled={isSaving}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
