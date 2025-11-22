"use client";

import { useState } from "react";
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import { saveLayoutTemplateContent } from "@/actions/cms/layout-actions";
import { useRouter } from "next/navigation";
import ContentEditorHeader from "@/components/cms/content-editor/ContentEditorHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LayoutTemplateContentEditorProps {
  templateId: string;
  websiteId: string;
  existingContent: any;
  originalFields: { id: string; type: string; content: any; content_field_id: string | null }[];
}

export function LayoutTemplateContentEditor({
  templateId,
  websiteId,
  existingContent,
  originalFields,
}: LayoutTemplateContentEditorProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const handleSaveContent = async (updatedFieldsJSON: string) => {
    const result = await saveLayoutTemplateContent(templateId, updatedFieldsJSON);

    if (result.success) {
      router.refresh();
      return { success: true, message: "Content saved successfully!" };
    } else {
      return { success: false, error: result.error || "Failed to save content" };
    }
  };

  const processedSections = existingContent?.schema?.sections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/websites/${websiteId}/layouts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
      </div>

      <ContentEditor
        pageId={templateId}
        existingContent={existingContent}
        originalFields={originalFields}
        saveFn={handleSaveContent}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        header={
          <ContentEditorHeader
            title={`${existingContent?.template?.name || "Template"} - Content Editor`}
            description={
              existingContent?.template?.description ||
              `Edit the content for your ${existingContent?.template?.type || "layout"} template`
            }
            processedSections={processedSections}
            setExpandedSections={setExpandedSections}
          />
        }
      />
    </div>
  );
}


