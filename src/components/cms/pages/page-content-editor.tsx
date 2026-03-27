"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/cms/content-editor/content_editor";
import ContentEditorHeader from "@/components/cms/content-editor/content_editor_header";
import { savePageContent } from "@/actions/cms/schema-content-actions";
import { RPCPageResponse } from "@/types/cms";
import { SaveContentFunction } from "@/stores/content-editor-store";

interface PageContentEditorProps {
  pageId: string;
  existingContent: RPCPageResponse;
  originalFields: { id: string; type: string; content: any; content_field_id?: string | null; collection_id?: string | null }[];
}

export function PageContentEditor({ pageId, existingContent, originalFields }: PageContentEditorProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  const saveFn: SaveContentFunction = async (updatedFieldsJSON: string) => {
    const result = await savePageContent(pageId, updatedFieldsJSON);
    if (result.success) {
      router.refresh();
    }

    return result;
  };

  const header = (
    <ContentEditorHeader
      title="Content Editor"
      description={`Edit content for "${existingContent.name}"`}
      processedSections={processedSections}
      setExpandedSections={setExpandedSections}
    />
  );

  return (
    <ContentEditor
      pageId={pageId}
      existingContent={existingContent}
      originalFields={originalFields}
      header={header}
      saveFn={saveFn}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
    />
  );
}
