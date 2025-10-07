"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { Section } from "@/types/cms";
import { revalidatePath } from "next/cache";
import { Field } from "@/types/cms";

// Helper function to check if a value is empty
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

// Helper function to check if richtext content is empty
const isRichTextEmpty = (value: any): boolean => {
  if (!value || typeof value !== 'object') return true;
  if (!value.content || !Array.isArray(value.content)) return true;
  return value.content.length === 0 || 
         (value.content.length === 1 && 
          value.content[0].type === 'paragraph' && 
          (!value.content[0].content || value.content[0].content.length === 0));
};

// Format content based on field type
const formatContentForFieldType = (fieldType: string, value: any): any => {
  // If value is empty, return null regardless of field type
  if (fieldType === 'richtext' && isRichTextEmpty(value)) {
    return null;
  } else if (isEmpty(value)) {
    return null;
  }

  switch (fieldType) {
    case 'text':
      return { value: String(value) };
    
    case 'richtext':
      // Rich text is stored as-is (JSON object)
      return value;
    
    case 'number':
      return { value: Number(value) };
    
    case 'boolean':
      return { value: Boolean(value) };
    
    case 'date':
      // Store date as ISO string
      return { value: value instanceof Date ? value.toISOString() : String(value) };
    
    case 'image':
      // Image might have URL, alt text, etc.
      if (typeof value === 'string') {
        return { url: value };
      } else if (typeof value === 'object' && value !== null) {
        return value; // Assume it's already in the correct format
      }
      return { url: String(value) };
    
    case 'video':
      // Video might have URL, thumbnail, etc.
      if (typeof value === 'string') {
        return { url: value };
      } else if (typeof value === 'object' && value !== null) {
        return value; // Assume it's already in the correct format
      }
      return { url: String(value) };
    
    case 'reference':
      // Reference might be an ID or object with ID and metadata
      if (typeof value === 'string' || typeof value === 'number') {
        return { id: value };
      } else if (typeof value === 'object' && value !== null) {
        return value; // Assume it's already in the correct format
      }
      return { id: String(value) };
    
    case 'section':
      // Section fields don't store content directly, skip them
      return null;
    
    default:
      // For unknown types, default to simple value wrapper
      return { value };
  }
};

export async function savePageContent(pageId: string, contentValues: (Field & { value?: any, fields?: any[] })[]) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }


    const updates: Array<{ fieldId: string; content: any }> = [];
    
    // Recursive function to process fields and their nested fields
    const processField = (field: Field & { value?: any, fields?: any[] }) => {
      // Handle the field's own content (skip section type as they don't store content)
      if (field.type !== 'section' && field.value !== undefined) {
        const formattedContent = formatContentForFieldType(field.type, field.value);
        updates.push({ 
          fieldId: field.id, 
          content: formattedContent 
        });
      }

      // Process nested fields if this is a section type field
      if (field.type === 'section' && field.fields && Array.isArray(field.fields)) {
        field.fields.forEach(nestedField => {
          processField(nestedField);
        });
      }
    };

    // Process all fields recursively
    for (const field of contentValues) {
      processField(field);
    }

    // Update each field's content in the database
    const updatePromises = updates.map(async ({ fieldId, content }) => {
      const { error } = await supabase
        .from('cms_fields')
        .update({ content: content })
        .eq('id', fieldId);
      
      if (error) {
        console.error(`Error updating field ${fieldId}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);


    // Revalidate the page to ensure fresh data
    revalidatePath(`/dashboard/websites`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to save content");
  }
}

// Extract value from content based on field type
const extractValueFromContent = (fieldType: string, content: any): any => {
  if (!content || content === null) {
    return '';
  }

  switch (fieldType) {
    case 'text':
    case 'number':
    case 'boolean':
    case 'date':
      return content.value || '';
    
    case 'richtext':
      return content.content || '';
    
    case 'image':
    case 'video':
      return content.url || content.value || '';
    
    case 'reference':
      return content.id || content.value || '';
    
    case 'section':
      return ''; // Section fields don't have content
    
    default:
      // For unknown types, try to extract value or return as-is
      return content.value || content || '';
  }
};

export async function loadPageContent(pageId: string, websiteId: string) {
  try {
    const supabase: any = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use RPC function to get page with nested sections and field content
    const { data: pageData, error } = await supabase.rpc("get_page", {
      page_id_param: pageId,
      website_id_param: websiteId,
    });

    if (error) {
      throw error;
    }

    if (!pageData || !Array.isArray(pageData) || pageData.length === 0) {
      throw new Error("Page not found");
    }

    // Extract the first (and only) page from the response array
    return pageData[0];
  } catch (error) {
    console.error("Error loading content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to load content");
  }
}
