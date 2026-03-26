import { notFound } from "next/navigation";
import { getCollectionEntryRPC } from "@/actions/cms/collection-entry-actions";
import { CollectionContentEditor } from "@/components/cms/collections/collection_content_editor";
import { RPCPageField } from "@/types/cms";
import type { Metadata } from "next";

interface CollectionEntryPageProps {
  params: Promise<{
    collectionId: string;
    entryId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit Entry",
  description: "Edit content for this collection entry.",
};

export default async function CollectionEntryPage({ params }: CollectionEntryPageProps) {
  const { collectionId, entryId } = await params;

  // Fetch the entry with schema and content using RPC (similar to get_page)
  const entryResult = await getCollectionEntryRPC(entryId);

  if (!entryResult.success || !entryResult.data) {
    console.error("Error fetching collection entry:", entryResult.error);
    return notFound();
  }

  const entry = entryResult.data;

  const applyRichTextConfig = (fields: RPCPageField[]): RPCPageField[] =>
    fields.map((field) => ({
      ...field,
      allowedNodes: Array.isArray(field.settings?.allowedNodes) ? field.settings.allowedNodes : [],
      fields: field.fields ? applyRichTextConfig(field.fields) : undefined,
    }))

  entry.sections = entry.sections.map((section) => ({
    ...section,
    fields: applyRichTextConfig(section.fields ?? []),
  }))

  // Recursively flatten all fields including nested fields
  const flattenFields = (fields: RPCPageField[]): RPCPageField[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        // Recursively flatten nested fields, but exclude the section field itself
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  // Map fields to the format expected by the content editor
  const fields: { id: string; type: string; content: unknown; content_field_id: string | null; collection_id?: string | null }[] = entry.sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id, // This is the schema field ID
      type: field.type,
      content: field.content ?? null,
      content_field_id: field.content_field_id ?? null, // This is the content field ID for updates
      collection_id: field.collection_id || null,
    }));

  return <CollectionContentEditor entryId={entryId} collectionId={collectionId} existingContent={entry} originalFields={fields} />;
}
