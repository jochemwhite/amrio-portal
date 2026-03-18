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

export type SectionDialogValues = {
  title: string
  description: string
}

type SectionDialogProps = {
  mode: "create" | "edit"
  open: boolean
  initialValues: SectionDialogValues
  onClose: () => void
  onSubmit: (values: SectionDialogValues) => void
}

export function SectionDialog({ mode, open, initialValues, onClose, onSubmit }: SectionDialogProps) {
  const [values, setValues] = useState<SectionDialogValues>(initialValues)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const titleError = values.title.trim() ? null : "Section name is required."

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
          <DialogTitle>{mode === "create" ? "Create Section" : "Edit Section"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new section and then add fields to it."
              : "Update this section's title and description."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Section Name *</label>
            <Input
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              aria-invalid={Boolean(titleError) && hasTriedSubmit}
              placeholder="Section name"
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
              placeholder="Optional section description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handle_submit}>{mode === "create" ? "Create Section" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ConfirmSectionDeleteDialogProps = {
  open: boolean
  sectionTitle: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmSectionDeleteDialog({
  open,
  sectionTitle,
  onCancel,
  onConfirm,
}: ConfirmSectionDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Section?</DialogTitle>
          <DialogDescription>
            This will permanently remove <span className="font-semibold text-foreground">{sectionTitle}</span> and
            all fields inside it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
