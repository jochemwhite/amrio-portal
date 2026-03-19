import { getAllLayoutsForWebsite, getLayoutEntryContent } from "@/actions/cms/layout-actions";
import { LayoutContentEditor } from "@/components/cms/layouts/layout_content_editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getActiveWebsiteId } from "@/server/utils";
import { RPCPageField, RPCPageResponse } from "@/types/cms";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

interface LayoutEditPageProps {
  params: Promise<{ layoutId: string }>;
}

export const metadata: Metadata = {
  title: "Layout Content",
  description: "Edit content assigned to this layout.",
};

export default async function LayoutEditPage({ params }: LayoutEditPageProps) {
  const { layoutId } = await params;
  const websiteId = await getActiveWebsiteId();

  if (!websiteId) {
    redirect("/dashboard/layouts");
  }

  const layoutsResult = await getAllLayoutsForWebsite(websiteId);
  if (!layoutsResult.success || !layoutsResult.data) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{layoutsResult.error || "Failed to load layout information"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const layout = layoutsResult.data.find((row) => row.template_id === layoutId);
  if (!layout) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Layout not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const contentResult = await getLayoutEntryContent(layoutId);
  if (!contentResult.success || !contentResult.data) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{contentResult.error || "Failed to load layout content"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const content = contentResult.data as RPCPageResponse;
  const existingContent: RPCPageResponse = {
    ...content,
    slug: content.slug || layout.type,
    status: content.status || "active",
    website_id: content.website_id || websiteId,
    created_at: content.created_at || layout.created_at,
    updated_at: content.updated_at || layout.updated_at,
  };

  const flattenFields = (fields: RPCPageField[]): RPCPageField[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  const originalFields: {
    id: string;
    type: string;
    content: unknown;
    content_field_id?: string | null;
    collection_id?: string | null;
  }[] = existingContent.sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id,
      type: field.type,
      content: field.content,
      content_field_id: field.content_field_id,
      collection_id: field.collection_id || null,
    }));

  return (
    <LayoutContentEditor
      layoutEntryId={layoutId}
      existingContent={existingContent}
      originalFields={originalFields}
      layoutType={layout.type}
      layoutName={layout.template_name}
      layoutDescription={layout.template_description}
    />
  );
}
