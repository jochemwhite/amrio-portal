import { notFound, redirect } from "next/navigation";
import { getAllLayoutsForWebsite, getTemplateWithContent } from "@/actions/cms/layout-actions";
import { getActiveWebsiteId } from "@/lib/utils/active-website-server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutContentEditorClient } from "@/components/cms/layouts/LayoutContentEditorClient";
import { RPCPageResponse, RPCPageSection, RPCPageField } from "@/types/cms";

export default async function LayoutEditPage({ params, searchParams }: { params: Promise<{ layoutId: string }>; searchParams: Promise<{ type?: string }> }) {
  const { layoutId } = await params;
  const activeWebsiteId = await getActiveWebsiteId();

  if (!activeWebsiteId) {
    redirect("/dashboard/layouts");
  }

  // Get the layout row info
  const layoutsResult = await getAllLayoutsForWebsite(activeWebsiteId);
  
  if (!layoutsResult.success || !layoutsResult.data) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {layoutsResult.error || "Failed to load layout information"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Find the layout row that matches this template
  const layout = layoutsResult.data.find(
    (row) => row.template_id === layoutId
  );

  if (!layout) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Layout not found
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get the template content
  const templateResult = await getTemplateWithContent(layoutId);

  if (!templateResult.success || !templateResult.data) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href="/dashboard/layouts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Layouts
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {templateResult.error || "Failed to load template content"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Transform template data into RPCPageResponse format
  const templateData = templateResult.data;
  const sections: RPCPageSection[] = templateData.schema?.sections?.map((section: any) => ({
    id: section.id,
    name: section.name,
    description: section.description || "",
    order: section.order,
    page_id: layoutId, // Use template ID as page ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fields: section.fields?.map((field: any) => ({
      id: field.id,
      name: field.name,
      description: field.description || "",
      type: field.type,
      order: field.order,
      required: field.required || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      validation: field.validation || "",
      default_value: field.default_value || "",
      parent_field_id: field.parent_field_id || null,
      collection_id: field.collection_id || null,
      settings: field.settings || null,
      content: field.content || null,
      content_field_id: field.content_field_id || null,
      fields: field.fields || [],
    })) || [],
  })) || [];

  const existingContent: RPCPageResponse = {
    id: layoutId,
    name: layout.template_name,
    slug: layout.type, // Use type as slug
    description: layout.template_description,
    status: "active",
    website_id: activeWebsiteId,
    created_at: layout.created_at,
    updated_at: layout.updated_at,
    schema_id: layout.schema_id,
    schema_name: layout.schema_name,
    schema_description: null,
    schema_template: false,
    sections: sections,
  };

  // Recursively flatten all fields
  const flattenFields = (fields: RPCPageField[]): RPCPageField[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  // Map fields to the format expected by the content editor
  const originalFields: { 
    id: string; 
    type: string; 
    content: any; 
    content_field_id?: string | null; 
    collection_id?: string | null 
  }[] = sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id,
      type: field.type,
      content: field.content,
      content_field_id: field.content_field_id,
      collection_id: field.collection_id || null,
    }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/dashboard/layouts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Layouts
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">
          Edit {layout.type}: {layout.template_name}
        </h1>
        <p className="text-muted-foreground">
          {layout.template_description || `Update the content for this ${layout.type} template`}
        </p>
      </div>

      <LayoutContentEditorClient
        templateId={layoutId}
        existingContent={existingContent}
        originalFields={originalFields}
      />
    </div>
  );
}

