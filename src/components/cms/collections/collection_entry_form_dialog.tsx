"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CollectionEntryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  initialName?: string | null;
}

export function CollectionEntryFormDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  description,
  submitLabel,
  submittingLabel,
  initialName,
}: CollectionEntryFormDialogProps) {
  const [name, setName] = useState(initialName?.trim() ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Entry name is required");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Entry name must be less than 100 characters");
      return;
    }

    await onSubmit(trimmedName);
  };

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="collection-entry-name">Name *</FieldLabel>
            <Input
              id="collection-entry-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Entry name"
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
