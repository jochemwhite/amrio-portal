"use client";

import { saveLayoutEntryContent } from "@/actions/cms/layout-actions";
import { ContentEditor } from "@/components/cms/content-editor/content_editor";
import ContentEditorHeader from "@/components/cms/content-editor/content_editor_header";
import { RPCPageResponse } from "@/types/cms";
import { SaveContentFunction } from "@/stores/content-editor-store";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface LayoutContentEditorClientProps {
  templateId: string;
  existingContent: RPCPageResponse;
  originalFields: {
    id: string;
    type: string;
    content: unknown;
    content_field_id?: string | null;
    collection_id?: string | null;
  }[];
}

export function LayoutContentEditorClient({ templateId, existingContent, originalFields }: LayoutContentEditorClientProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  const saveFn: SaveContentFunction = async (updatedFieldsJSON: string) => {
    try {
      const result = await saveLayoutEntryContent(templateId, updatedFieldsJSON);
      if (!result.success) {
        return { success: false, error: result.error || "Failed to save content" };
      }

      router.refresh();
      return { success: true, message: "Content saved successfully" };
    } catch (error) {
      console.error("Error saving layout template content:", error);
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  return (
    <ContentEditor
      pageId={templateId}
      existingContent={existingContent}
      originalFields={originalFields}
      saveFn={saveFn}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
      header={
        <ContentEditorHeader
          title="Layout Content Editor"
          description={`Edit content for "${existingContent.name}"`}
          processedSections={processedSections}
          setExpandedSections={setExpandedSections}
        />
      }
    />
  );
}
