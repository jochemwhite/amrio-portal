import { SchemaTable } from '@/components/admin/schemas/SchemaTable'
import { getAllSchemas } from '@/actions/cms/schema-actions'
import { CreateSchemaButton } from '@/components/admin/schemas/CreateSchemaButton'

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
        <SchemaTable schemas={result.data || []} />
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

