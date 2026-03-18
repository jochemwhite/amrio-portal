"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ReferenceSelectorDialog } from "./reference_selector_dialog";
import { getCollectionEntries, CollectionEntry } from "@/actions/cms/collection-entry-actions";
import { List, X } from "lucide-react";
import { FieldComponentProps, useContentEditorStore } from "@/stores/content-editor-store";

export default function Reference({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const { getFieldCollectionId } = useContentEditorStore();
  const collectionId = getFieldCollectionId(field.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Load entry names for display
  useEffect(() => {
    if (collectionId && value && !value.all && value.entry_ids?.length > 0) {
      loadEntryNames();
    }
  }, [collectionId, value]);

  const loadEntryNames = async () => {
    if (!collectionId) return;

    setIsLoadingEntries(true);
    try {
      const result = await getCollectionEntries(collectionId);
      if (result.success && result.data) {
        setEntries(result.data);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleRemoveEntry = (entryId: string) => {
    if (!value || value.all) return;

    const updatedEntryIds = value.entry_ids?.filter((id: string) => id !== entryId) || [];
    handleFieldChange(field.id, { entry_ids: updatedEntryIds });
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = (newValue: { entry_ids: string[] | "ALL" }) => {
    handleFieldChange(field.id, newValue);
  };

  if (!collectionId) {
    return (
      <div className="space-y-2">
        <Label>{field.name}</Label>
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
          <p className="text-sm">No collection configured for this reference field.</p>
          <p className="text-xs mt-1">Please configure a collection in the schema builder.</p>
        </div>
      </div>
    );
  }

  // Get selected entry names
  const selectedEntries = value?.entry_ids ? entries.filter((entry) => value.entry_ids.includes(entry.id)) : [];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Display current selection */}
      <div className="space-y-3">
        {value?.all ? (
          <Badge variant="secondary" className="text-sm">
            All entries selected
          </Badge>
        ) : value?.entry_ids && value.entry_ids.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {isLoadingEntries ? (
              <Badge variant="secondary">Loading entries...</Badge>
            ) : selectedEntries.length > 0 ? (
              selectedEntries.map((entry) => (
                <Badge key={entry.id} variant="secondary" className="text-sm pr-1">
                  {entry.name || "Untitled Entry"}
                  <button
                    onClick={() => handleRemoveEntry(entry.id)}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                    aria-label={`Remove ${entry.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-sm">
                {value.entry_ids.length} {value.entry_ids.length === 1 ? "entry" : "entries"} selected
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No entries selected</p>
        )}

        {/* Select button */}
        <Button type="button" variant="outline" onClick={handleOpenDialog} className="w-full sm:w-auto">
          <List className="h-4 w-4 mr-2" />
          {value?.all || (value?.entry_ids && value.entry_ids.length > 0) ? "Change Selection" : "Select Entries"}
        </Button>
      </div>

      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}

      {/* Reference Selector Dialog */}
      <ReferenceSelectorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        collectionId={collectionId}
        currentValue={value}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
