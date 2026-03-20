"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { CollectionEntryTable } from "./collection_entry_table";
import { CollectionWithSchema } from "@/actions/cms/collection-actions";
import { CollectionEntry, createCollectionEntry } from "@/actions/cms/collection-entry-actions";
import { toast } from "sonner";
import Link from "next/link";
import { CollectionEntryFormDialog } from "./collection_entry_form_dialog";

interface CollectionEntriesOverviewProps {
  collection: CollectionWithSchema;
  initialEntries: CollectionEntry[];
  collectionId: string;
}

export function CollectionEntriesOverview({ collection, initialEntries, collectionId }: CollectionEntriesOverviewProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<CollectionEntry[]>(initialEntries);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateEntry = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createCollectionEntry({
        collection_id: collectionId,
        name,
      });

      if (result.success && result.data) {
        toast.success("Entry created successfully");
        setEntries((prev) => [result.data!, ...prev]);
        setIsCreateDialogOpen(false);
        router.push(`/dashboard/collections/${collectionId}/entries/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create entry");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEntryDeleted = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleEntryUpdated = (updatedEntry: CollectionEntry) => {
    setEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
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
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">Add your first entry to start building your collection content.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        ) : (
          <CollectionEntryTable
            entries={entries}
            collectionId={collectionId}
            onEntryDeleted={handleEntryDeleted}
            onEntryUpdated={handleEntryUpdated}
          />
        )}

        <CollectionEntryFormDialog
          key={isCreateDialogOpen ? "create-open" : "create-closed"}
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={handleCreateEntry}
          isSubmitting={isCreating}
          title="Create Entry"
          description="Add a new entry to this collection."
          submitLabel="Create Entry"
          submittingLabel="Creating..."
        />
      </div>
    </div>
  );
}
