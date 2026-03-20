"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContentEditor } from "@/components/cms/content-editor/content_editor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  updateCollectionEntry,
  saveCollectionEntryContent,
} from "@/actions/cms/collection-entry-actions";
import { RPCCollectionEntryResponse } from "@/types/cms";
import { toast } from "sonner";
import ContentEditorHeader from "../content-editor/content_editor_header";
import { CollectionEntryFormDialog } from "./collection_entry_form_dialog";

interface CollectionContentEditorProps {
  entryId: string;
  collectionId: string;
  existingContent: RPCCollectionEntryResponse;
  originalFields: {
    id: string;
    type: string;
    content: any;
    content_field_id: string | null;
    collection_id?: string | null;
  }[];
}

export function CollectionContentEditor({
  entryId,
  collectionId,
  existingContent,
  originalFields,
}: CollectionContentEditorProps) {
  const router = useRouter();
  const [entryName, setEntryName] = useState(existingContent.name || "");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  // Create save function that matches SaveContentFunction signature
  const saveFn = useMemo(() => {
    return async (
      updatedFields: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
      const result = await saveCollectionEntryContent(entryId, updatedFields);
      if (result.success) {
        return {
          success: true,
          message: "Collection entry saved successfully",
        };
      } else {
        return { success: false, error: result.error };
      }
    };
  }, [entryId]);

  const handleSave = async () => {
    router.refresh();
  };

  const handleRenameEntry = async (name: string) => {
    setIsUpdatingName(true);
    try {
      const nameResult = await updateCollectionEntry(entryId, {
        name,
      });
      if (!nameResult.success || !nameResult.data) {
        toast.error(nameResult.error || "Failed to update entry name");
        return;
      }

      setEntryName(nameResult.data.name || "");
      setIsRenameDialogOpen(false);
      toast.success("Entry name updated");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingName(false);
    }
  };
  const header = (
    <ContentEditorHeader
      title="Collection Entry Editor"
      description={`Edit content for "${existingContent.collection_name}"`}
      processedSections={processedSections}
      setExpandedSections={setExpandedSections}
    />
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 ">
          <Link href={`/dashboard/collections/${collectionId}/entries`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Entries
            </Button>
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold">{entryName || "Untitled Entry"}</h2>
            <Button variant="outline" size="sm" onClick={() => setIsRenameDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename Entry
            </Button>
          </div>
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

        <CollectionEntryFormDialog
          key={isRenameDialogOpen ? "rename-open" : "rename-closed"}
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onSubmit={handleRenameEntry}
          isSubmitting={isUpdatingName}
          title="Rename Entry"
          description="Update the name of this collection entry."
          submitLabel="Save"
          submittingLabel="Saving..."
          initialName={entryName}
        />
      </div>
    </div>
  );
}
