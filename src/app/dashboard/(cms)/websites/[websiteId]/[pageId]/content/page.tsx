import React from "react";
import { ContentEditor } from "@/components/cms/content-editor/ContentEditor";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { notFound } from "next/navigation";
import { RPCPageResponse } from "@/types/cms";

interface PageBuilderProps {
  params: Promise<{
    websiteId: string;
    pageId: string;
  }>;
}

export default async function ContentPage({ params }: PageBuilderProps) {
  const { pageId, websiteId } = await params;
  const supabase: any = await createClient();
  const { data: pageData, error: pageError } = await supabase.rpc("get_page", {
    page_id_param: pageId,
    website_id_param: websiteId,
  });

  if (pageError) {
    console.error("Error fetching page:", pageError);
    return notFound();
  }

  if (!pageData) {
    console.error("Page not found:", pageError);
    return notFound();
  }

  // Extract the first (and only) page from the response array
  const page: RPCPageResponse = pageData[0];

  return <ContentEditor pageId={pageId} existingContent={page} />;
}
