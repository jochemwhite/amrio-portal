import { getAllLayoutsForWebsite, getTemplateWithContent } from "@/actions/cms/layout-actions";
import { LayoutContentEditor } from "@/components/cms/layouts/layout_content_editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getActiveWebsiteId } from "@/server/utils";
import { RPCPageField, RPCPageResponse, RPCPageSection } from "@/types/cms";
import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

interface LayoutEditPageProps {
  params: Promise<{ layoutId: string }>;
}

type TemplateField = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  order: number;
  required?: boolean;
  validation?: string | null;
  default_value?: string | null;
  parent_field_id?: string | null;
  collection_id?: string | null;
  settings?: Record<string, unknown> | null;
  content?: { value?: unknown } | null;
  content_field_id?: string | null;
  fields?: TemplateField[];
};

type TemplateSection = {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  fields?: TemplateField[];
};

type TemplateWithContentResponse = {
  schema?: {
    sections?: TemplateSection[];
  };
};

function mapTemplateFieldToRpcField(field: TemplateField): RPCPageField {
  const rawContent =
    field.content && typeof field.content === "object" && "value" in field.content
      ? field.content.value
      : field.content;

  return {
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
    content: rawContent === null || rawContent === undefined ? null : { value: rawContent },
    content_field_id: field.content_field_id || null,
    fields: (field.fields || []).map(mapTemplateFieldToRpcField),
  };
}

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

  const templateResult = await getTemplateWithContent(layoutId);
  if (!templateResult.success || !templateResult.data) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{templateResult.error || "Failed to load template content"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const templateData = templateResult.data as TemplateWithContentResponse;
  const sections: RPCPageSection[] =
    templateData.schema?.sections?.map((section) => ({
      id: section.id,
      name: section.name,
      description: section.description || "",
      order: section.order,
      page_id: layoutId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: (section.fields || []).map(mapTemplateFieldToRpcField),
    })) || [];

  const existingContent: RPCPageResponse = {
    id: layoutId,
    name: layout.template_name,
    slug: layout.type,
    description: layout.template_description,
    status: "active",
    website_id: websiteId,
    created_at: layout.created_at,
    updated_at: layout.updated_at,
    schema_id: layout.schema_id,
    schema_name: layout.schema_name,
    schema_description: null,
    schema_template: false,
    sections,
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
  }[] = sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id,
      type: field.type,
      content:
        field.content && typeof field.content === "object" && "value" in field.content ? field.content.value : null,
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
