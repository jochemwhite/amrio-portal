import { notFound, redirect } from "next/navigation";
import { getActiveTenantId } from "@/server/utils";
import { getCollectionById } from "@/actions/cms/collection-actions";
import { getCollectionEntries } from "@/actions/cms/collection-entry-actions";
import { CollectionEntriesOverview } from "@/components/cms/collections/collection_entries_overview";
import type { Metadata } from "next";

interface CollectionEntriesPageProps {
  params: Promise<{
    collectionId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Collection Entries",
  description: "View and manage entries in this collection.",
};

export default async function CollectionEntriesPage({ params }: CollectionEntriesPageProps) {
  const { collectionId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch the collection
  const collectionResult = await getCollectionById(collectionId);

  if (!collectionResult.success || !collectionResult.data) {
    notFound();
  }

  const collection = collectionResult.data;

  // Fetch entries for this collection
  const entriesResult = await getCollectionEntries(collectionId);
  const entries = entriesResult.success ? entriesResult.data || [] : [];

  return <CollectionEntriesOverview collection={collection} initialEntries={entries} collectionId={collectionId} />;
}
