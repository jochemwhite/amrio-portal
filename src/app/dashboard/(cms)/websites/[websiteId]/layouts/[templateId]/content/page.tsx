import { getTemplateWithContent } from "@/actions/cms/layout-actions";
import { LayoutTemplateContentEditor } from "@/components/cms/layouts/LayoutTemplateContentEditor";
import { getActiveTenantId } from "@/server/utils";
import { notFound, redirect } from "next/navigation";

interface LayoutContentPageProps {
  params: Promise<{ websiteId: string; templateId: string }>;
}

export default async function LayoutContentPage({ params }: LayoutContentPageProps) {
  const { websiteId, templateId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Fetch template with content using RPC function
  const templateResult = await getTemplateWithContent(templateId);

  if (!templateResult.success || !templateResult.data) {
    console.error("Template not found:", templateResult.error);
    notFound();
  }

  const templateData = templateResult.data;

  // Recursively flatten all fields including nested fields
  const flattenFields = (fields: any[]): any[] => {
    if (!fields) return [];
    
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  // Map fields to the format expected by the content editor
  const fields: { id: string; type: string; content: any; content_field_id: string | null }[] =
    templateData.schema.sections
      .flatMap((section: any) => flattenFields(section.fields || []))
      .map((field: any) => ({
        id: field.id, // This is the schema field ID
        type: field.type,
        content: field.content,
        content_field_id: field.content_field_id, // This is the content field ID for updates
      }));

  return (
    <LayoutTemplateContentEditor
      templateId={templateId}
      websiteId={websiteId}
      existingContent={templateData}
      originalFields={fields}
    />
  );
}


