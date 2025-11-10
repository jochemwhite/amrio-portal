import { SupabaseSchemaWithRelations, SchemaField, SchemaSection } from "@/types/cms";

interface CollectionSchema {
  id: string;
  name: string;
  cms_schema_sections: SchemaSection[];
}

/**
 * Maps CMS field types to TypeScript types
 */
const FIELD_TYPE_MAP: Record<string, string> = {
  text: "string",
  richtext: "string",
  number: "number",
  boolean: "boolean",
  date: "string", // ISO date string
  image: "string", // URL string
  video: "string", // URL or video ID
  reference: "string", // Reference ID - will be overridden if collection_id is present
  button: "{ text: string; url: string; variant?: string }", // Button object
  section: "object", // Will be expanded to nested type
};

/**
 * Sanitizes field keys to valid TypeScript identifiers
 */
function sanitizeFieldKey(fieldKey: string): string {
  // Replace invalid characters with underscores
  let sanitized = fieldKey.replace(/[^a-zA-Z0-9_]/g, "_");
  
  // If it starts with a number, prefix with underscore
  if (/^[0-9]/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  
  return sanitized;
}

/**
 * Converts a field name to a valid field key if not provided
 */
function fieldNameToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^[0-9]/, "_$&");
}

/**
 * Gets the TypeScript type for a field
 */
function getFieldType(
  field: SchemaField, 
  nestedFields?: SchemaField[], 
  collectionMap?: Map<string, string>
): string {
  const baseType = FIELD_TYPE_MAP[field.type] || "any";
  
  // If it's a section type, generate nested interface
  if (field.type === "section" && nestedFields && nestedFields.length > 0) {
    const nestedTypeName = toPascalCase(field.field_key || fieldNameToKey(field.name));
    return nestedTypeName;
  }
  
  // If it's a reference type with a collection_id, use the collection type
  if (field.type === "reference" && field.collection_id && collectionMap) {
    const collectionTypeName = collectionMap.get(field.collection_id);
    if (collectionTypeName) {
      return collectionTypeName;
    }
  }
  
  return baseType;
}

/**
 * Converts a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Generates a TypeScript interface for nested fields (section type)
 */
function generateNestedInterface(
  field: SchemaField,
  nestedFields: SchemaField[],
  allFields: SchemaField[],
  collectionMap: Map<string, string>,
  indent: string = "  "
): string {
  const typeName = toPascalCase(field.field_key || fieldNameToKey(field.name));
  const lines: string[] = [];
  
  lines.push(`${indent}interface ${typeName} {`);
  
  for (const nestedField of nestedFields) {
    const fieldKey = sanitizeFieldKey(nestedField.field_key || fieldNameToKey(nestedField.name));
    const childNestedFields = allFields.filter(f => f.parent_field_id === nestedField.id);
    const fieldType = getFieldType(nestedField, childNestedFields, collectionMap);
    const optional = !nestedField.required ? "?" : "";
    
    lines.push(`${indent}  ${fieldKey}${optional}: ${fieldType};`);
    
    // Generate nested interface if this is also a section type
    if (nestedField.type === "section" && childNestedFields.length > 0) {
      lines.push("");
      lines.push(generateNestedInterface(nestedField, childNestedFields, allFields, collectionMap, indent + "  "));
    }
  }
  
  lines.push(`${indent}}`);
  
  return lines.join("\n");
}

/**
 * Generates TypeScript interfaces for a section
 */
function generateSectionInterface(
  section: SchemaSection,
  collectionMap: Map<string, string>,
  indent: string = "  "
): string {
  const lines: string[] = [];
  const sectionName = toPascalCase(sanitizeFieldKey(section.name));
  
  lines.push(`${indent}interface ${sectionName}Section {`);
  
  if (!section.cms_schema_fields || section.cms_schema_fields.length === 0) {
    lines.push(`${indent}  // No fields defined`);
    lines.push(`${indent}}`);
    return lines.join("\n");
  }
  
  // Get only root-level fields (no parent_field_id)
  const rootFields = section.cms_schema_fields.filter(f => !f.parent_field_id);
  const allFields = section.cms_schema_fields;
  
  // Generate nested interfaces first (for section type fields)
  const nestedInterfaces: string[] = [];
  for (const field of rootFields) {
    if (field.type === "section") {
      const nestedFields = allFields.filter(f => f.parent_field_id === field.id);
      if (nestedFields.length > 0) {
        nestedInterfaces.push(
          generateNestedInterface(field, nestedFields, allFields, collectionMap, indent + "  ")
        );
      }
    }
  }
  
  // Generate field definitions
  for (const field of rootFields) {
    const fieldKey = sanitizeFieldKey(field.field_key || fieldNameToKey(field.name));
    const nestedFields = allFields.filter(f => f.parent_field_id === field.id);
    const fieldType = getFieldType(field, nestedFields, collectionMap);
    const optional = !field.required ? "?" : "";
    
    lines.push(`${indent}  ${fieldKey}${optional}: ${fieldType};`);
  }
  
  lines.push(`${indent}}`);
  
  // Add nested interfaces after the main interface
  if (nestedInterfaces.length > 0) {
    lines.push("");
    lines.push(nestedInterfaces.join("\n\n"));
  }
  
  return lines.join("\n");
}

/**
 * Generates TypeScript interface for a collection
 */
function generateCollectionInterface(
  collection: CollectionSchema,
  collectionMap: Map<string, string>,
  indent: string = "  "
): string {
  const lines: string[] = [];
  const collectionName = toPascalCase(sanitizeFieldKey(collection.name));
  
  lines.push(`${indent}interface ${collectionName}Entry {`);
  lines.push(`${indent}  id: string;`);
  
  if (collection.cms_schema_sections && collection.cms_schema_sections.length > 0) {
    for (const section of collection.cms_schema_sections) {
      if (section.cms_schema_fields && section.cms_schema_fields.length > 0) {
        const rootFields = section.cms_schema_fields.filter(f => !f.parent_field_id);
        
        for (const field of rootFields) {
          const fieldKey = sanitizeFieldKey(field.field_key || fieldNameToKey(field.name));
          const nestedFields = section.cms_schema_fields.filter(f => f.parent_field_id === field.id);
          const fieldType = getFieldType(field, nestedFields, collectionMap);
          const optional = !field.required ? "?" : "";
          
          lines.push(`${indent}  ${fieldKey}${optional}: ${fieldType};`);
        }
      }
    }
  }
  
  lines.push(`${indent}}`);
  
  return lines.join("\n");
}

/**
 * Generates the complete TypeScript type definitions for a schema
 */
export function generateTypeScript(
  schema: SupabaseSchemaWithRelations, 
  collections?: CollectionSchema[]
): string {
  const lines: string[] = [];
  
  // Header comment
  lines.push("/**");
  lines.push(` * TypeScript types for ${schema.name}`);
  if (schema.description) {
    lines.push(` * ${schema.description}`);
  }
  lines.push(` * Generated on: ${new Date().toISOString()}`);
  lines.push(" * ");
  lines.push(" * Usage:");
  lines.push(" * ```typescript");
  lines.push(" * import { transformApiResponse } from '@/lib/api-transformer';");
  lines.push(" * import { PageContent } from './types';");
  lines.push(" * ");
  lines.push(" * // Fetch raw data from your API");
  lines.push(" * const response = await fetch('/api/page-content?slug=/');");
  lines.push(" * const rawData = await response.json();");
  lines.push(" * ");
  lines.push(" * // Transform to typed structure");
  lines.push(" * const pageData = transformApiResponse<PageContent['sections']>(rawData);");
  lines.push(" * ");
  lines.push(" * // Now you have full TypeScript autocomplete!");
  lines.push(" * console.log(pageData.sections.Hero.title);");
  lines.push(" * ```");
  lines.push(" */");
  lines.push("");
  
  // Build collection map (collection_id -> TypeName)
  const collectionMap = new Map<string, string>();
  if (collections && collections.length > 0) {
    for (const collection of collections) {
      const typeName = toPascalCase(sanitizeFieldKey(collection.name)) + "Entry";
      collectionMap.set(collection.id, typeName);
    }
  }
  
  // Generate collection interfaces first
  const collectionInterfaces: string[] = [];
  if (collections && collections.length > 0) {
    for (const collection of collections) {
      collectionInterfaces.push(generateCollectionInterface(collection, collectionMap));
    }
  }
  
  if (collectionInterfaces.length > 0) {
    lines.push(collectionInterfaces.join("\n\n"));
    lines.push("");
  }
  
  // Generate section interfaces
  const sectionInterfaces: string[] = [];
  if (schema.cms_schema_sections && schema.cms_schema_sections.length > 0) {
    for (const section of schema.cms_schema_sections) {
      sectionInterfaces.push(generateSectionInterface(section, collectionMap));
    }
  }
  
  lines.push(sectionInterfaces.join("\n\n"));
  lines.push("");
  
  // Generate main PageContent interface
  lines.push("  export interface PageContent {");
  lines.push("    id: string;");
  lines.push("    slug: string;");
  lines.push("    sections: {");
  
  if (schema.cms_schema_sections && schema.cms_schema_sections.length > 0) {
    for (const section of schema.cms_schema_sections) {
      const sectionName = toPascalCase(sanitizeFieldKey(section.name));
      lines.push(`      ${sanitizeFieldKey(section.name)}: ${sectionName}Section;`);
    }
  } else {
    lines.push("      // No sections defined");
  }
  
  lines.push("    };");
  lines.push("  }");
  lines.push("");
  
  // Add helper type for accessing section content
  lines.push("  export type SectionContent = PageContent['sections'];");
  
  return lines.join("\n");
}

/**
 * Generates TypeScript types for a schema and returns it as a downloadable string
 */
export async function generateTypesForSchema(
  schemaId: string
): Promise<{ success: boolean; types?: string; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/supabaseServerClient");
    const supabase = await createClient();
    
    // Fetch the schema with all sections and fields
    const { data: schema, error } = await supabase
      .from("cms_schemas")
      .select(`
        *,
        cms_schema_sections (
          *,
          cms_schema_fields (*)
        )
      `)
      .eq("id", schemaId)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!schema) {
      return { success: false, error: "Schema not found" };
    }
    
    const types = generateTypeScript(schema as any);
    
    return { success: true, types };
  } catch (error) {
    console.error("Error generating types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

