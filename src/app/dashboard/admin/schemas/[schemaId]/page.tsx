import { getSchemaById } from '@/actions/cms/schema-actions'
import { SchemaBuilder } from '@/components/cms/schema-builder/SchemaBuilder'
import { notFound } from 'next/navigation'
import { SupabaseSchemaWithRelations } from '@/types/cms'

interface SchemaBuilderPageProps {
  params: {
    schemaId: string
  }
}

export default async function SchemaBuilderPage({ params }: SchemaBuilderPageProps) {
  const { schemaId } = params
  const result = await getSchemaById(schemaId)

  if (!result.success || !result.data) {
    notFound()
  }

  // Transform the schema data to match the expected format
  const schema = result.data as SupabaseSchemaWithRelations

  return (
    <div>
      <SchemaBuilder 
        initialSchema={schema} 
        pageId={schemaId} 
        websiteId="admin" 
      />
    </div>
  )
}

