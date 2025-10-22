"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCollectionsByWebsite } from "@/actions/cms/collection-actions";
import { getCollectionEntries } from "@/actions/cms/collection-entry-actions";
import { Loader2 } from "lucide-react";

interface CollectionPickerProps {
  field: any;
  fieldId: string;
  value: any; // { collection_id: string, entry_id: string } or null
  error?: string;
  handleFieldChange: (fieldId: string, value: any) => void;
  handleFieldBlur: (field: any) => void;
  websiteId: string;
}

export function CollectionPicker({
  field,
  fieldId,
  value,
  error,
  handleFieldChange,
  handleFieldBlur,
  websiteId,
}: CollectionPickerProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    value?.collection_id || null
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    value?.entry_id || null
  );

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      setIsLoadingCollections(true);
      try {
        const result = await getCollectionsByWebsite(websiteId);
        if (result.success && result.data) {
          setCollections(result.data);
        }
      } catch (error) {
        console.error("Error loading collections:", error);
      } finally {
        setIsLoadingCollections(false);
      }
    };

    if (websiteId) {
      loadCollections();
    }
  }, [websiteId]);

  // Load entries when collection is selected
  useEffect(() => {
    const loadEntries = async () => {
      if (!selectedCollectionId) {
        setEntries([]);
        return;
      }

      setIsLoadingEntries(true);
      try {
        const result = await getCollectionEntries(selectedCollectionId);
        if (result.success && result.data) {
          setEntries(result.data);
        }
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    loadEntries();
  }, [selectedCollectionId]);

  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedEntryId(null);
    handleFieldChange(field.id, { collection_id: collectionId, entry_id: null });
  };

  const handleEntryChange = (entryId: string) => {
    setSelectedEntryId(entryId);
    handleFieldChange(field.id, { collection_id: selectedCollectionId, entry_id: entryId });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${fieldId}-collection`}>
          {field.name}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {isLoadingCollections ? (
          <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No collections available</p>
        ) : (
          <>
            <Select
              value={selectedCollectionId || ""}
              onValueChange={handleCollectionChange}
              onOpenChange={() => handleFieldBlur(field)}
            >
              <SelectTrigger id={`${fieldId}-collection`} className={error ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a collection..." />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {selectedCollectionId && (
        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-entry`}>Select Entry</Label>

          {isLoadingEntries ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries in this collection</p>
          ) : (
            <Select
              value={selectedEntryId || ""}
              onValueChange={handleEntryChange}
            >
              <SelectTrigger id={`${fieldId}-entry`}>
                <SelectValue placeholder="Select an entry..." />
              </SelectTrigger>
              <SelectContent>
                {entries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name || "Untitled Entry"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}



