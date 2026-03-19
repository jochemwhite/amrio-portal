import { getCollectionWithSchemaRPC } from "@/actions/cms/collection-rpc-actions";
import { SchemaBuilder } from "@/components/cms/schema-builder/SchemaBuilder";
import { getActiveTenantId } from "@/server/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Collection Schema",
  description: "Configure the schema for this collection.",
};

export default async function CollectionSchemaPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  const result = await getCollectionWithSchemaRPC(collectionId);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Collection Found</h1>
          <p className="text-muted-foreground">{result.error || "No collection found"}</p>
        </div>
      </div>
    );
  }

  const collection = result.data;
  const schema = collection.cms_schemas; // Already loaded!

  if (!schema) {
    return <div className="container mx-auto py-6">no Schema found</div>;
  }

  return <SchemaBuilder initialSchema={schema} pageId={collectionId} websiteId={collection.website_id || ""} />;
}
