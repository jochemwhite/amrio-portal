"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import ContentEditorHeader from "@/components/cms/content-editor/ContentEditorHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { CollectionWithSchema } from "@/actions/cms/collection-actions";
import { CollectionEntryWithItems, updateCollectionEntry } from "@/actions/cms/collection-entry-actions";
import { RPCPageResponse } from "@/types/cms";
import { toast } from "sonner";

interface CollectionContentEditorProps {
  collection: CollectionWithSchema;
  entry: CollectionEntryWithItems;
  collectionId: string;
  entryId: string;
}

export function CollectionContentEditor({ collection, entry, collectionId, entryId }: CollectionContentEditorProps) {
  const router = useRouter();
  const [entryName, setEntryName] = useState(entry.name || "");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Transform collection schema to match RPCPageResponse format
  const transformedContent: RPCPageResponse = useMemo(() => {
    const sections = collection.cms_schemas?.cms_schema_sections?.map((section) => ({
      id: section.id,
      name: section.name,
      description: section.description,
      order: section.order,
      fields: section.cms_schema_fields?.map((field) => {
        // Find the corresponding collection item for this field
        const item = entry.cms_collections_items?.find((i) => i.schema_field_id === field.id);
        return {
          id: field.id,
          name: field.name,
          type: field.type,
          description: field.description,
          required: field.required,
          order: field.order,
          content: item?.content,
          content_field_id: item?.id || null,
          collection_id: field.collection_id || null,
          parent_field_id: field.parent_field_id,
          fields: field.fields || [],
        };
      }) || [],
    })) || [];

    return {
      id: entry.id,
      name: entryName,
      sections,
    } as RPCPageResponse;
  }, [collection, entry, entryName]);

  // Flatten fields for ContentEditor
  const flattenFields = (fields: any[]): any[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  const originalFields = useMemo(() => {
    return transformedContent.sections
      .flatMap((section) => flattenFields(section.fields))
      .map((field) => ({
        id: field.id,
        type: field.type,
        content: field.content,
        content_field_id: field.content_field_id,
        collection_id: field.collection_id || null,
      }));
  }, [transformedContent]);

  const processedSections = useMemo(() => {
    return transformedContent.sections || [];
  }, [transformedContent.sections]);

  const handleSave = async () => {
    // Update entry name if it changed
    if (entryName !== entry.name) {
      const nameResult = await updateCollectionEntry(entryId, { name: entryName });
      if (!nameResult.success) {
        toast.error(nameResult.error || "Failed to update entry name");
        return;
      }
    }
    router.refresh();
  };

  const header = (
    <ContentEditorHeader
      title="Collection Entry Editor"
      processedSections={processedSections}
      setExpandedSections={setExpandedSections}
    >
      <div className="mt-4 max-w-md">
        <Label htmlFor="entry-name" className="text-sm font-medium">
          Entry Name
        </Label>
        <Input
          id="entry-name"
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="Entry name"
          className="mt-2"
        />
      </div>
    </ContentEditorHeader>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/dashboard/collections/${collectionId}/entries`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Entries
            </Button>
          </Link>
        </div>

        <Separator className="my-6" />

        <ContentEditor
          pageId={entryId}
          existingContent={transformedContent}
          originalFields={originalFields}
          header={header}
          onSave={handleSave}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
        />
      </div>
    </div>
  );
}

