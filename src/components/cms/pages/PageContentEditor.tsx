"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import ContentEditorHeader from "@/components/cms/content-editor/ContentEditorHeader";
import { RPCPageResponse } from "@/types/cms";

interface PageContentEditorProps {
  pageId: string;
  existingContent: RPCPageResponse;
  originalFields: { id: string; type: string; content: any; collection_id?: string | null }[];
}

export function PageContentEditor({ pageId, existingContent, originalFields }: PageContentEditorProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  const handleSave = async () => {
    router.refresh();
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
      onSave={handleSave}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
    />
  );
}

