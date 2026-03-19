import { SchemaTable } from '@/components/admin/schemas/SchemaTable'
import { getAllSchemas } from '@/actions/cms/schema-actions'
import { CreateSchemaButton } from '@/components/admin/schemas/CreateSchemaButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schema Management",
  description: "Create and manage CMS schemas for pages, collections, and layouts.",
};

export default async function SchemasPage() {
  const result = await getAllSchemas()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schema Management</h1>
          <p className="text-muted-foreground">
            Create and manage content schemas for your CMS.
          </p>
        </div>
        <CreateSchemaButton />
      </div>

      {result.success ? (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {/* <TabsTrigger value="templates">Templates</TabsTrigger> */}
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <SchemaTable schemas={result.data || []} />
          </TabsContent>
          {/* <TabsContent value="templates">
            <SchemaTable schemas={result.data?.filter((schema) => schema.template) || []} />
          </TabsContent> */}
          <TabsContent value="pages">
            <SchemaTable schemas={result.data?.filter((schema) => schema.schema_type === "page") || []} />
          </TabsContent>
          <TabsContent value="collections">
            <SchemaTable schemas={result.data?.filter((schema) => schema.schema_type === "collection") || []} />
          </TabsContent>
          <TabsContent value="layouts">
            <SchemaTable schemas={result.data?.filter((schema) => String(schema.schema_type) === "layout") || []} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load schemas: {result.error}
          </p>
        </div>
      )}
    </div>
  )
}
