import { notFound, redirect } from "next/navigation";
import { getActiveTenantId } from "@/server/utils";
import { getCollectionById } from "@/actions/cms/collection-actions";
import { getCollectionEntryById } from "@/actions/cms/collection-entry-actions";
import { CollectionContentEditor } from "@/components/cms/collections/CollectionContentEditor";

interface CollectionEntryPageProps {
  params: Promise<{
    collectionId: string;
    entryId: string;
  }>;
}

export default async function CollectionEntryPage({ params }: CollectionEntryPageProps) {
  const { collectionId, entryId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch the collection with schema
  const collectionResult = await getCollectionById(collectionId);

  if (!collectionResult.success || !collectionResult.data) {
    notFound();
  }

  const collection = collectionResult.data;

  // Fetch the entry with items
  const entryResult = await getCollectionEntryById(entryId);

  if (!entryResult.success || !entryResult.data) {
    notFound();
  }

  const entry = entryResult.data;

  return (
    <CollectionContentEditor
      collection={collection}
      entry={entry}
      collectionId={collectionId}
      entryId={entryId}
    />
  );
}

