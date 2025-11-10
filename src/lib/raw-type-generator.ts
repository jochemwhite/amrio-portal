import { SupabaseSchemaWithRelations, SchemaField, SchemaSection } from "@/types/cms";

interface CollectionSchema {
  id: string;
  name: string;
  cms_schema_sections: SchemaSection[];
}

/**
 * Maps CMS field types to TypeScript content types
 */
const CONTENT_TYPE_MAP: Record<string, string> = {
  text: "string | null",
  richtext: "any | null", // Rich text editor content (JSON)
  number: "number | null",
  boolean: "boolean | null",
  date: "string | null", // ISO date string
  image: "{ url: string; alt: string; caption: string } | null",
  video: "{ url: string; title: string; description: string } | null",
  button: "{ href: string; icon?: string; label: string; target?: string; custom_href?: string } | null",
  reference: "{ entries: any[] }", // Will be typed based on collection
  section: "null", // Sections have items, not content
};

/**
 * Sanitizes field keys to valid TypeScript identifiers
 */
function sanitizeFieldKey(fieldKey: string): string {
  let sanitized = fieldKey.replace(/[^a-zA-Z0-9_]/g, "_");
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
 * Converts a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Generates TypeScript interface for collection entry items
 */
function generateCollectionItemsInterface(
  collection: CollectionSchema,
  collectionMap: Map<string, string>,
  indent: string = "  "
): string {
  const lines: string[] = [];
  const collectionName = toPascalCase(sanitizeFieldKey(collection.name));
  
  lines.push(`${indent}interface ${collectionName}Item {`);
  lines.push(`${indent}  id: string;`);
  lines.push(`${indent}  name: string;`);
  lines.push(`${indent}  order: number;`);
  lines.push(`${indent}  content: any;`);
  lines.push(`${indent}  field_key: string;`);
  lines.push(`${indent}  field_type: string;`);
  
  // Check if collection has nested sections
  let hasNestedSections = false;
  if (collection.cms_schema_sections) {
    for (const section of collection.cms_schema_sections) {
      if (section.cms_schema_fields) {
        for (const field of section.cms_schema_fields) {
          if (field.type === "section") {
            hasNestedSections = true;
            break;
          }
        }
      }
      if (hasNestedSections) break;
    }
  }
  
  if (hasNestedSections) {
    lines.push(`${indent}  items?: ${collectionName}Item[];`);
  }
  
  lines.push(`${indent}}`);
  lines.push("");
  
  // Generate entry interface
  lines.push(`${indent}interface ${collectionName}Entry {`);
  lines.push(`${indent}  id: string;`);
  lines.push(`${indent}  name: string;`);
  lines.push(`${indent}  items: ${collectionName}Item[];`);
  lines.push(`${indent}}`);
  
  return lines.join("\n");
}

/**
 * Generates the complete raw API TypeScript types
 */
export function generateRawApiTypes(
  schema: SupabaseSchemaWithRelations,
  collections?: CollectionSchema[]
): string {
  const lines: string[] = [];
  
  // Header comment
  lines.push("/**");
  lines.push(` * Raw API TypeScript types for ${schema.name}`);
  if (schema.description) {
    lines.push(` * ${schema.description}`);
  }
  lines.push(` * Generated on: ${new Date().toISOString()}`);
  lines.push(" * ");
  lines.push(" * These types match the raw API response structure with all metadata.");
  lines.push(" * ");
  lines.push(" * Usage:");
  lines.push(" * ```typescript");
  lines.push(" * import { ApiResponse, PageData } from './types';");
  lines.push(" * ");
  lines.push(" * const response: ApiResponse = await fetch('/api/page-content?slug=/');");
  lines.push(" * const data: PageData = response.data;");
  lines.push(" * ");
  lines.push(" * // Access with full type safety");
  lines.push(" * data.sections.forEach(section => {");
  lines.push(" *   console.log(section.name);");
  lines.push(" *   section.fields.forEach(field => {");
  lines.push(" *     console.log(field.field_key, field.content);");
  lines.push(" *   });");
  lines.push(" * });");
  lines.push(" * ```");
  lines.push(" */");
  lines.push("");
  
  // Build collection map
  const collectionMap = new Map<string, string>();
  if (collections && collections.length > 0) {
    for (const collection of collections) {
      const typeName = toPascalCase(sanitizeFieldKey(collection.name));
      collectionMap.set(collection.id, typeName);
    }
  }
  
  // Generate collection interfaces
  if (collections && collections.length > 0) {
    for (const collection of collections) {
      lines.push(generateCollectionItemsInterface(collection, collectionMap));
      lines.push("");
    }
  }
  
  // Generate base field interface
  lines.push("export interface Field {");
  lines.push("  id: string;");
  lines.push("  name: string;");
  lines.push("  type: string;");
  lines.push("  order: number;");
  lines.push("  content: any;");
  lines.push("  field_key: string;");
  lines.push("  field_type?: string;");
  lines.push("  items?: Field[];");
  lines.push("}");
  lines.push("");
  
  // Generate section interface
  lines.push("export interface Section {");
  lines.push("  id: string;");
  lines.push("  name: string;");
  lines.push("  order: number;");
  lines.push("  fields: Field[];");
  lines.push("}");
  lines.push("");
  
  // Generate page data interface
  lines.push("export interface PageData {");
  lines.push("  id: string;");
  lines.push("  slug: string;");
  lines.push("  sections: Section[];");
  lines.push("}");
  lines.push("");
  
  // Generate API response interface
  lines.push("export interface ApiResponse {");
  lines.push("  success: boolean;");
  lines.push("  data: PageData;");
  lines.push("}");
  lines.push("");
  
  // Add helper type for section names
  if (schema.cms_schema_sections && schema.cms_schema_sections.length > 0) {
    const sectionNames = schema.cms_schema_sections.map(s => `"${s.name}"`).join(" | ");
    lines.push(`export type SectionName = ${sectionNames};`);
    lines.push("");
  }
  
  // Add helper functions
  lines.push("// Helper functions for type-safe access");
  lines.push("");
  lines.push("/**");
  lines.push(" * Get a section by name with type safety");
  lines.push(" */");
  lines.push("export function getSection(data: PageData, name: string): Section | undefined {");
  lines.push("  return data.sections.find(s => s.name === name);");
  lines.push("}");
  lines.push("");
  lines.push("/**");
  lines.push(" * Get a field from a section by field_key");
  lines.push(" */");
  lines.push("export function getField(section: Section, fieldKey: string): Field | undefined {");
  lines.push("  return section.fields.find(f => f.field_key === fieldKey);");
  lines.push("}");
  lines.push("");
  lines.push("/**");
  lines.push(" * Get field content with type casting");
  lines.push(" */");
  lines.push("export function getFieldContent<T = any>(section: Section, fieldKey: string): T | null {");
  lines.push("  const field = getField(section, fieldKey);");
  lines.push("  return field ? (field.content as T) : null;");
  lines.push("}");
  
  return lines.join("\n");
}


