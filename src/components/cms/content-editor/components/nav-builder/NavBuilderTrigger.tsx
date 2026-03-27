"use client"

import { useState } from "react"
import { Navigation } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"

import { NavBuilderDialog } from "./NavBuilderDialog"
import type { NavBuilderProps } from "./nav-builder.types"
import { useNavBuilder } from "./useNavBuilder"

export function NavBuilderTrigger(props: NavBuilderProps) {
  const builder = useNavBuilder(props)
  const [open, setOpen] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  async function handleSave() {
    const didSave = await builder.saveMenu()

    if (didSave) {
      setOpen(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true)
      return
    }

    if (builder.isDirty) {
      setShowDiscardDialog(true)
      return
    }

    setOpen(false)
  }

  function handleDiscard() {
    builder.resetMenu()
    setShowDiscardDialog(false)
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Navigation className="size-4" />
            Edit Navigation
          </Button>
        </DialogTrigger>

        <NavBuilderDialog
          availablePages={props.availablePages ?? []}
          builder={builder}
          isLoading={props.isLoading}
          onCancel={() => handleOpenChange(false)}
          onSave={handleSave}
        />
      </Dialog>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes. Discard?</AlertDialogTitle>
            <AlertDialogDescription>
              Your navigation edits will be lost if you close the builder without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
