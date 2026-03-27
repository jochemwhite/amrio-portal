"use client"

import { useEffect, useRef, useState } from "react"
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
  const [didJustSave, setDidJustSave] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  async function handleSave() {
    const didSave = await builder.saveMenu()

    if (!didSave) {
      setDidJustSave(false)
      return
    }

    setDidJustSave(true)

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = setTimeout(() => {
      setDidJustSave(false)
      setOpen(false)
    }, 1200)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDidJustSave(false)
      setOpen(true)
      return
    }

    if (builder.isDirty) {
      setShowDiscardDialog(true)
      return
    }

    setDidJustSave(false)
    setOpen(false)
  }

  function handleDiscard() {
    builder.resetMenu()
    setDidJustSave(false)
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
          didJustSave={didJustSave}
          isLoading={props.isLoading}
          onCancel={() => handleOpenChange(false)}
          onSave={handleSave}
        />
      </Dialog>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this menu. They will be lost if you close without
              saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
