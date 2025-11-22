"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import ContentEditorHeader from "@/components/cms/content-editor/ContentEditorHeader";
import { saveLayoutTemplateContent } from "@/actions/cms/layout-actions";
import { RPCPageResponse } from "@/types/cms";
import { SaveContentFunction } from "@/stores/useContentEditorStore";

interface LayoutContentEditorClientProps {
  templateId: string;
  existingContent: RPCPageResponse;
  originalFields: { 
    id: string; 
    type: string; 
    content: any; 
    content_field_id?: string | null; 
    collection_id?: string | null 
  }[];
}

export function LayoutContentEditorClient({ 
  templateId, 
  existingContent, 
  originalFields 
}: LayoutContentEditorClientProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  // Create a save function that matches the SaveContentFunction signature
  const saveFn: SaveContentFunction = async (updatedFieldsJSON: string) => {
    try {
      // Parse the fields from ContentEditor format
      const updatedFieldsArray: Array<{ 
        id: string; 
        content: any; 
        type: string; 
        content_field_id?: string | null 
      }> = JSON.parse(updatedFieldsJSON);

      // Transform to layout template format
      const layoutFields = updatedFieldsArray.map((field) => ({
        schema_field_id: field.id,
        content: field.content,
        content_field_id: field.content_field_id || null,
      }));

      const result = await saveLayoutTemplateContent(templateId, JSON.stringify(layoutFields));
      
      if (result.success) {
        // Refresh the page to get updated data
        router.refresh();
        return { success: true, message: "Content saved successfully" };
      } else {
        return { success: false, error: result.error || "Failed to save content" };
      }
    } catch (error) {
      console.error("Error saving layout content:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const header = (
    <ContentEditorHeader
      title="Layout Content Editor"
      description={`Edit content for "${existingContent.name}"`}
      processedSections={processedSections}
      setExpandedSections={setExpandedSections}
    />
  );

  return (
    <ContentEditor
      pageId={templateId}
      existingContent={existingContent}
      originalFields={originalFields}
      header={header}
      saveFn={saveFn}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
    />
  );
}

