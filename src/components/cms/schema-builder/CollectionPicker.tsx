"use client";

import { getCollectionsByWebsite } from "@/actions/cms/collection-actions";
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveWebsiteIdClient } from "@/lib/utils/active-website-client";

interface CollectionPickerProps {
  collectionId?: string | null;
  setCollectionId: (collectionId: string) => void;
}

export default function CollectionPicker({ collectionId, setCollectionId }: CollectionPickerProps) {
  const websiteId = getActiveWebsiteIdClient();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  if (!websiteId) {
    return <div>No website selected</div>;
  }
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

  useEffect(() => {
    console.log("collectionId", collectionId);
  }, [collectionId]);

  return (
    <div>
      <Select value={collectionId || ""} onValueChange={setCollectionId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a collection" />
        </SelectTrigger>
        <SelectContent>
          {collections.map((collection) => (
            <SelectItem key={collection.id} value={collection.id}>
              {collection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
