import { notFound } from "next/navigation";
import { getCollectionEntryRPC } from "@/actions/cms/collection-entry-actions";
import { CollectionContentEditor } from "@/components/cms/collections/collection_content_editor";
import { RPCCollectionEntryResponse } from "@/types/cms";

interface CollectionEntryPageProps {
  params: Promise<{
    collectionId: string;
    entryId: string;
  }>;
}

export default async function CollectionEntryPage({ params }: CollectionEntryPageProps) {
  const { collectionId, entryId } = await params;

  // Fetch the entry with schema and content using RPC (similar to get_page)
  const entryResult = await getCollectionEntryRPC(entryId);

  if (!entryResult.success || !entryResult.data) {
    console.error("Error fetching collection entry:", entryResult.error);
    return notFound();
  }

  const entry = entryResult.data;

  // Recursively flatten all fields including nested fields
  const flattenFields = (fields: any[]): any[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        // Recursively flatten nested fields, but exclude the section field itself
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  // Map fields to the format expected by the content editor
  const fields: { id: string; type: string; content: any; content_field_id: string | null; collection_id?: string | null }[] = entry.sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id, // This is the schema field ID
      type: field.type,
      content: field.content,
      content_field_id: field.content_field_id, // This is the content field ID for updates
      collection_id: field.collection_id || null,
    }));

  return <CollectionContentEditor entryId={entryId} collectionId={collectionId} existingContent={entry} originalFields={fields} />;
}
