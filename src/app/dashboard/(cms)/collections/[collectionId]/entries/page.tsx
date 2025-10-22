import { notFound, redirect } from "next/navigation";
import { getActiveTenantId } from "@/server/utils";
import { getCollectionById } from "@/actions/cms/collection-actions";
import { getCollectionEntries } from "@/actions/cms/collection-entry-actions";
import { CollectionEntriesOverview } from "@/components/cms/collections/CollectionEntriesOverview";

interface CollectionEntriesPageProps {
  params: {
    collectionId: string;
  };
}

export default async function CollectionEntriesPage({ params }: CollectionEntriesPageProps) {
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch the collection
  const collectionResult = await getCollectionById(params.collectionId);

  if (!collectionResult.success || !collectionResult.data) {
    notFound();
  }

  const collection = collectionResult.data;

  // Fetch entries for this collection
  const entriesResult = await getCollectionEntries(params.collectionId);
  const entries = entriesResult.success ? entriesResult.data || [] : [];

  return (
    <CollectionEntriesOverview
      collection={collection}
      initialEntries={entries}
      collectionId={params.collectionId}
    />
  );
}



