import type { Schema, SchemaField } from "@/types/cms"
import type { SchemaSavePayload } from "@/types/schema_builder"

import { clone_schema } from "./schema_builder_utils"
import type {
  FieldItem,
  FieldType,
  NestedSectionItem,
  SchemaDocument,
  SchemaItem,
} from "./schema_builder_types"

export function map_schema_to_document(schema: Schema): SchemaDocument {
  return {
    id: schema.id,
    title: schema.name,
    description: schema.description ?? null,
    isTemplate: schema.template,
    schemaType: schema.schema_type,
    sections:
      schema.cms_schema_sections?.map((section) => ({
        id: section.id,
        title: section.name,
        description: section.description ?? null,
        schemaId: section.schema_id,
        items: build_schema_items(section.cms_schema_fields ?? [], null, section.id),
      })) ?? [],
  }
}

function build_schema_items(
  fields: SchemaField[],
  parentFieldId: string | null,
  schemaSectionId: string
): SchemaItem[] {
  return fields
    .filter((field) => (field.parent_field_id ?? null) === parentFieldId)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((field) => {
      if (field.type === "section") {
        const nestedSection: NestedSectionItem = {
          id: field.id,
          kind: "nested",
          label: field.name,
          databaseType: field.type,
          fieldKey: field.field_key,
          required: field.required,
          settings: field.settings ?? null,
          validation: field.validation ?? null,
          defaultValue: field.default_value ?? null,
          collectionId: field.collection_id ?? null,
          schemaSectionId,
          parentFieldId: field.parent_field_id ?? null,
          open: true,
          items: build_schema_items(fields, field.id, schemaSectionId),
        }

        return nestedSection
      }

      const schemaField: FieldItem = {
        id: field.id,
        kind: "field",
        label: field.name,
        databaseType: field.type,
        fieldKey: field.field_key,
        fieldType: map_field_type(field.type),
        required: field.required,
        settings: field.settings ?? null,
        validation: field.validation ?? null,
        defaultValue: field.default_value ?? null,
        collectionId: field.collection_id ?? null,
        schemaSectionId,
        parentFieldId: field.parent_field_id ?? null,
      }

      return schemaField
    })
}

function map_field_type(type: string): FieldType {
  switch (type) {
    case "image":
      return "Image"
    case "richtext":
      return "Rich Text"
    case "text":
    default:
      return "Text"
  }
}

export function clone_schema_document(document: SchemaDocument): SchemaDocument {
  return {
    ...document,
    sections: clone_schema(document.sections),
  }
}

export function serialize_schema_document(document: SchemaDocument): SchemaSavePayload {
  const fields: SchemaSavePayload["fields"] = []

  for (const section of document.sections) {
    const orderRef = { current: 0 }
    collect_section_fields(section.items, section.id, null, fields, orderRef)
  }

  return {
    schema: {
      name: document.title,
      description: document.description ?? null,
      template: document.isTemplate,
    },
    sections: document.sections.map((section, index) => ({
      id: section.id,
      order: index,
      name: section.title,
      description: section.description ?? null,
    })),
    fields,
  }
}

function collect_section_fields(
  items: SchemaItem[],
  schemaSectionId: string,
  parentFieldId: string | null,
  fields: SchemaSavePayload["fields"],
  orderRef: { current: number }
) {
  for (const item of items) {
    fields.push({
      id: item.id,
      order: orderRef.current++,
      schemaSectionId,
      parentFieldId,
      name: item.label,
      fieldKey: item.fieldKey,
      type: item.databaseType,
      required: item.required,
      defaultValue: item.defaultValue ?? null,
      validation: item.validation ?? null,
      settings: item.settings ?? null,
      collectionId: item.collectionId ?? null,
    })

    if (item.kind === "nested") {
      collect_section_fields(item.items, schemaSectionId, item.id, fields, orderRef)
    }
  }
}
