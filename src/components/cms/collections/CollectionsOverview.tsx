"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CollectionTable } from "./CollectionTable";
import { CollectionFormDialog } from "./CollectionFormDialog";
import { CollectionWithSchema } from "@/actions/cms/collection-actions";
import { CmsHeader } from "../shared/cmsHeader";

interface CollectionsOverviewProps {
  website: {
    id: string;
    name: string;
    description: string | null;
  };
  initialCollections: CollectionWithSchema[];
  websiteId: string;
}

export function CollectionsOverview({ website, initialCollections, websiteId }: CollectionsOverviewProps) {
  const [collections, setCollections] = useState<CollectionWithSchema[]>(initialCollections);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCollectionCreated = (newCollection: CollectionWithSchema) => {
    setCollections((prev) => [newCollection, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleCollectionDeleted = (collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  };

  return (
    <div className="min-h-screen">
      <CmsHeader />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground mt-1">
              Manage content collections for {website.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first collection to start managing reusable content.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </div>
        ) : (
          <CollectionTable 
            collections={collections} 
            onCollectionDeleted={handleCollectionDeleted}
          />
        )}

        <CollectionFormDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={handleCollectionCreated}
          websiteId={websiteId}
        />
      </div>
    </div>
  );
}


