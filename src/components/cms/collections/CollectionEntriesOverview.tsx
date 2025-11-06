"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import { CollectionEntryTable } from "./CollectionEntryTable";
import { CollectionWithSchema } from "@/actions/cms/collection-actions";
import { CollectionEntry, createCollectionEntry } from "@/actions/cms/collection-entry-actions";
import { toast } from "sonner";
import Link from "next/link";

interface CollectionEntriesOverviewProps {
  collection: CollectionWithSchema;
  initialEntries: CollectionEntry[];
  collectionId: string;
}

export function CollectionEntriesOverview({ collection, initialEntries, collectionId }: CollectionEntriesOverviewProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<CollectionEntry[]>(initialEntries);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEntry = async () => {
    setIsCreating(true);
    try {
      const result = await createCollectionEntry({
        collection_id: collectionId,
        name: "New Entry",
      });

      if (result.success && result.data) {
        toast.success("Entry created successfully");
        setEntries((prev) => [result.data!, ...prev]);
        // Navigate to the new entry
        router.push(`/dashboard/collections/${collectionId}/entries/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create entry");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEntryDeleted = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard/collections">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              {collection.description && <p className="text-muted-foreground mt-1">{collection.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateEntry} disabled={isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreating ? "Creating..." : "Add Entry"}
              </Button>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">Add your first entry to start building your collection content.</p>
            <Button onClick={handleCreateEntry} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Add Entry"}
            </Button>
          </div>
        ) : (
          <CollectionEntryTable entries={entries} collectionId={collectionId} onEntryDeleted={handleEntryDeleted} />
        )}
      </div>
    </div>
  );
}
