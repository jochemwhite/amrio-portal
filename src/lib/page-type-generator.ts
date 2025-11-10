/**
 * Page-based TypeScript Type Generator
 * 
 * Generates TypeScript types from get_page_content RPC response
 * Creates discriminated unions for different field types
 */

import { GetPageContentResponse, PageContentField } from "@/actions/cms/page-type-generator-actions";

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
 * Get unique field types from the page content
 */
function getUniqueFieldTypes(pageContent: GetPageContentResponse): Set<string> {
  const types = new Set<string>();
  
  function collectTypes(fields: PageContentField[]) {
    for (const field of fields) {
      types.add(field.type);
      if (field.fields) {
        collectTypes(field.fields);
      }
    }
  }
  
  pageContent.sections.forEach(section => {
    collectTypes(section.fields);
  });
  
  return types;
}

/**
 * Generate content type definition for a specific field type
 */
function generateContentType(fieldType: string, indent: string = "  "): string {
  const contentTypes: Record<string, string> = {
    text: "string | null",
    number: "number | null",
    boolean: "boolean | null",
    date: "string | null",
    richtext: `{
${indent}  type: string;
${indent}  content?: any[];
${indent}} | null`,
    image: `{
${indent}  url: string;
${indent}  alt?: string;
${indent}  caption?: string;
${indent}} | null`,
    video: `{
${indent}  url: string;
${indent}  title?: string;
${indent}  description?: string;
${indent}} | null`,
    button: `{
${indent}  href?: string;
${indent}  icon?: string;
${indent}  label?: string;
${indent}  target?: string;
${indent}  custom_href?: string;
${indent}} | null`,
    section: "null",
  };
  
  return contentTypes[fieldType] || "any";
}

/**
 * Generates TypeScript types matching the API response structure
 */
export function generateFlatPageInterface(
  pageContent: GetPageContentResponse,
  pageName: string
): string {
  const lines: string[] = [];
  const interfaceName = toPascalCase(pageName);
  
  // Get unique field types to generate discriminated unions
  const fieldTypes = getUniqueFieldTypes(pageContent);
  const hasReference = fieldTypes.has("reference");
  
  // Generate collection item types if there are reference fields
  if (hasReference) {
    lines.push("interface CollectionItem {");
    lines.push("  id: string;");
    lines.push("  name: string;");
    lines.push("  order?: number;");
    lines.push("  content: any;");
    lines.push("  field_key: string;");
    lines.push("  field_type?: string;");
    lines.push("  items?: CollectionItem[];");
    lines.push("}");
    lines.push("");
    
    lines.push("interface CollectionEntry {");
    lines.push("  id: string;");
    lines.push("  name: string;");
    lines.push("  items: CollectionItem[];");
    lines.push("}");
    lines.push("");
  }
  
  // Generate field union type
  lines.push("type Field =");
  const fieldTypesList = Array.from(fieldTypes);
  
  fieldTypesList.forEach((fieldType, index) => {
    const isLast = index === fieldTypesList.length - 1;
    const separator = isLast ? ";" : " |";
    
    lines.push(`  ${separator} {`);
    lines.push(`      id: string;`);
    lines.push(`      name: string;`);
    lines.push(`      type: "${fieldType}";`);
    lines.push(`      order: number;`);
    lines.push(`      field_key: string;`);
    
    // Add specific content type based on field type
    if (fieldType === "reference") {
      lines.push(`      content: {`);
      lines.push(`        entries: CollectionEntry[];`);
      lines.push(`      } | null;`);
    } else if (fieldType === "section") {
      lines.push(`      content: null;`);
      lines.push(`      fields?: Field[];`);
    } else {
      const contentType = generateContentType(fieldType, "      ");
      lines.push(`      content: ${contentType};`);
    }
    
    lines.push(`    }`);
  });
  
  lines.push("");
  
  // Generate section interface
  lines.push("interface Section {");
  lines.push("  id: string;");
  lines.push("  name: string;");
  lines.push("  order: number;");
  lines.push("  fields: Field[];");
  lines.push("}");
  lines.push("");
  
  // Generate main response interface
  lines.push(`export interface ${interfaceName}Response {`);
  lines.push("  success: true;");
  lines.push("  data: {");
  lines.push("    id: string;");
  lines.push("    slug: string;");
  lines.push("    sections: Section[];");
  lines.push("  };");
  lines.push("}");
  
  return lines.join("\n");
}

