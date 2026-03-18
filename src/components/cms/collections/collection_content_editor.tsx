"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContentEditor } from "@/components/cms/content-editor/content_editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { updateCollectionEntry, saveCollectionEntryContent } from "@/actions/cms/collection-entry-actions";
import { RPCCollectionEntryResponse } from "@/types/cms";
import { toast } from "sonner";
import ContentEditorHeader from "../content-editor/content_editor_header";

interface CollectionContentEditorProps {
  entryId: string;
  collectionId: string;
  existingContent: RPCCollectionEntryResponse;
  originalFields: { id: string; type: string; content: any; content_field_id: string | null; collection_id?: string | null }[];
}

export function CollectionContentEditor({ entryId, collectionId, existingContent, originalFields }: CollectionContentEditorProps) {
  const router = useRouter();
  const [entryName, setEntryName] = useState(existingContent.name || "");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  // Create save function that matches SaveContentFunction signature
  const saveFn = useMemo(() => {
    return async (updatedFields: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const result = await saveCollectionEntryContent(entryId, updatedFields);
      if (result.success) {
        return { success: true, message: "Collection entry saved successfully" };
      } else {
        return { success: false, error: result.error };
      }
    };
  }, [entryId]);

  const handleSave = async () => {
    // Update entry name if it changed
    if (entryName !== existingContent.name) {
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
      description={`Edit content for "${existingContent.collection_name}"`}
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
          existingContent={existingContent as any}
          originalFields={originalFields}
          header={header}
          saveFn={saveFn}
          onSave={handleSave}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
        />
      </div>
    </div>
  );
}

