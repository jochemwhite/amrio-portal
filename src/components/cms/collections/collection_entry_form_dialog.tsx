"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getEntrySlugInputValue, isValidEntrySlug, joinUrlPaths, normalizeEntrySlug } from "@/lib/cms/slug-utils";

interface CollectionEntryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; slug: string | null }) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  initialName?: string | null;
  initialSlug?: string | null;
  showSlugField?: boolean;
  slugPrefix?: string | null;
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
  initialSlug,
  showSlugField = false,
  slugPrefix,
}: CollectionEntryFormDialogProps) {
  const [name, setName] = useState(initialName?.trim() ?? "");
  const [slug, setSlug] = useState(getEntrySlugInputValue(initialSlug));
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugTouchedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName?.trim() ?? "");
      setSlug(getEntrySlugInputValue(initialSlug));
      setError(null);
      setSlugError(null);
      slugTouchedRef.current = Boolean(getEntrySlugInputValue(initialSlug));
    }
  }, [initialName, initialSlug, isOpen]);

  useEffect(() => {
    if (!showSlugField || !isOpen || slugTouchedRef.current) {
      return;
    }

    const nextSlug = normalizeEntrySlug(name);
    setSlug(getEntrySlugInputValue(nextSlug));
    setSlugError(null);
  }, [isOpen, name, showSlugField]);

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

    const trimmedSlug = slug.trim();
    const normalizedSlug = trimmedSlug ? normalizeEntrySlug(trimmedSlug) : "";
    if (showSlugField && normalizedSlug && !isValidEntrySlug(normalizedSlug)) {
      setSlugError("Entry slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    await onSubmit({
      name: trimmedName,
      slug: showSlugField ? (normalizedSlug || null) : null,
    });
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

          {showSlugField ? (
            <Field data-invalid={Boolean(slugError)}>
              <FieldLabel htmlFor="collection-entry-slug">Slug</FieldLabel>
              <Input
                id="collection-entry-slug"
                value={slug}
                onChange={(e) => {
                  slugTouchedRef.current = true;
                  setSlug(getEntrySlugInputValue(normalizeEntrySlug(e.target.value)));
                  if (slugError) {
                    setSlugError(null);
                  }
                }}
                placeholder="about-me"
                disabled={isSubmitting}
                aria-invalid={Boolean(slugError)}
              />
              <FieldDescription>
                Entry URL: `{joinUrlPaths(slugPrefix || "/blog", slug ? normalizeEntrySlug(slug) : "/about-me")}`
              </FieldDescription>
              {slugError ? <FieldError>{slugError}</FieldError> : null}
            </Field>
          ) : null}

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
