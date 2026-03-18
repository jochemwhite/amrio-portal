export type SchemaSavePayload = {
  schema: {
    name: string
    description: string | null
    template: boolean
  }
  sections: Array<{
    id: string
    order: number
    name: string
    description: string | null
  }>
  fields: Array<{
    id: string
    order: number
    schemaSectionId: string
    parentFieldId: string | null
    name: string
    fieldKey: string
    type: string
    required: boolean
    defaultValue: string | null
    validation: string | null
    settings: Record<string, unknown> | null
    collectionId: string | null
  }>
}
