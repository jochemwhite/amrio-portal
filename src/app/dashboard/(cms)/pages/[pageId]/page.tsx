import React from "react";
import { PageContentEditor } from "@/components/cms/pages/PageContentEditor";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { notFound } from "next/navigation";
import { RPCPageResponse } from "@/types/cms";

interface PageContentProps {
  params: Promise<{
    pageId: string;
  }>;
}

export default async function PageContentPage({ params }: PageContentProps) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: pageData, error: pageError } = await supabase
    .rpc("get_page", {
      page_id_param: pageId,
    })
    .overrideTypes<RPCPageResponse[]>();

  if (pageError) {
    console.error("Error fetching page:", pageError);
    return notFound();
  }

  if (!pageData || !Array.isArray(pageData) || pageData.length === 0) {
    console.error("Page not found:", pageError);
    return notFound();
  }

  // Extract the first (and only) page from the response array
  const page = pageData[0];

  // Recursively flatten all fields including nested fields
  // The new schema-based function returns fields with both schema field ID and content field ID
  const flattenFields = (fields: any[]): any[] => {
    return fields.flatMap((field) => {
      if (field.type === "section" && field.fields) {
        // Recursively flatten nested fields, but exclude the section field itself
        return flattenFields(field.fields);
      }
      return [field];
    });
  };

  // Map fields to the format expected by the content editor
  // Now using schema_field_id (field.id) as the primary ID and content_field_id for saves
  const fields: { id: string; type: string; content: any; content_field_id: string | null; collection_id?: string | null }[] = page.sections
    .flatMap((section) => flattenFields(section.fields))
    .map((field) => ({
      id: field.id, // This is the schema field ID
      type: field.type,
      content: field.content,
      content_field_id: field.content_field_id, // This is the content field ID for updates
      collection_id: field.collection_id || null,
    }));

  return <PageContentEditor pageId={pageId} existingContent={page} originalFields={fields} />;
}
