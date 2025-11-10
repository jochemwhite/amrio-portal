/**
 * Transforms raw CMS API response to typed content structure
 * 
 * This utility converts the nested array structure from the database
 * (with ids, orders, field_keys, etc.) into a clean, typed object
 * that matches the generated TypeScript types.
 */

export interface RawField {
  id: string;
  name: string;
  type: string;
  order: number;
  content: any;
  field_key: string;
  field_type?: string;
  items?: RawField[];
}

export interface RawSection {
  id: string;
  name: string;
  order: number;
  fields: RawField[];
}

export interface RawPageContent {
  id: string;
  slug: string;
  sections: RawSection[];
}

export interface RawApiResponse {
  success: boolean;
  data: RawPageContent;
}

/**
 * Transforms a raw field into its content value
 */
function transformField(field: RawField): any {
  // Handle section fields with nested items
  if (field.field_type === 'section' && field.items) {
    const sectionContent: Record<string, any> = {};
    for (const item of field.items) {
      sectionContent[item.field_key] = transformField(item);
    }
    return sectionContent;
  }

  // Handle reference fields with entries
  if (field.type === 'reference' && field.content?.entries) {
    return field.content.entries.map((entry: any) => {
      const entryData: Record<string, any> = {
        id: entry.id,
        name: entry.name,
      };
      
      if (entry.items) {
        for (const item of entry.items) {
          entryData[item.field_key] = transformField(item);
        }
      }
      
      return entryData;
    });
  }

  // Return the content directly for simple fields
  return field.content;
}

/**
 * Transforms raw API response into typed page content
 * 
 * @example
 * ```typescript
 * import { transformPageContent } from '@/lib/api-transformer';
 * import { PageContent } from './types/cms';
 * 
 * const response = await fetch('/api/page-content');
 * const rawData = await response.json();
 * const pageData: PageContent = transformPageContent(rawData.data);
 * ```
 */
export function transformPageContent(raw: RawPageContent): {
  id: string;
  slug: string;
  sections: Record<string, any>;
} {
  const sections: Record<string, any> = {};

  for (const section of raw.sections) {
    const sectionContent: Record<string, any> = {};
    
    for (const field of section.fields) {
      sectionContent[field.field_key] = transformField(field);
    }
    
    sections[section.name] = sectionContent;
  }

  return {
    id: raw.id,
    slug: raw.slug,
    sections,
  };
}

/**
 * Type-safe transformer that validates the structure
 */
export function transformApiResponse<T = any>(response: RawApiResponse): {
  id: string;
  slug: string;
  sections: T;
} {
  if (!response.success || !response.data) {
    throw new Error('Invalid API response');
  }

  return transformPageContent(response.data) as any;
}


