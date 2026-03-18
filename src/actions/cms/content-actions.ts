"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

// Helper function to check if a value is empty
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};



// Format content based on field type
const formatContentForFieldType = (fieldType: string, value: any): any => {
  if (fieldType === 'richtext') {
    console.log(`Value is ${value}`);
    return null;
  } else if (isEmpty(value)) {
    return null;
  }

  switch (fieldType) {
    case 'text':
      console.log(`Value is ${value}`);
      return value.toString();
    
    case 'richtext':
      // Rich text is stored as-is (JSON object)
      return { content: value };
    
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

export async function savePageContent(pageId: string, contentValues: Record<string, any>) {
  try {
    const supabase = await createClient();

    console.log(`savePageContent: ${pageId}, ${contentValues}`);
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // First, get field information to determine field types
    const { data: fields, error: fieldsError } = await supabase
      .from('cms_content_fields')
      .select(`
        id,
        type,
        name,
        section_id,
        cms_sections!inner(page_id)
      `)
      .eq('cms_sections.page_id', pageId);

    if (fieldsError) {
      throw new Error("Failed to fetch field information");
    }

    // Create maps for field information
    const fieldTypeMap: Record<string, string> = {};
    const fieldInfoMap: Record<string, any> = {};
    fields?.forEach(field => {
      fieldTypeMap[field.id] = field.type;
      fieldInfoMap[field.id] = {
        name: field.name,
        section_id: field.section_id,
        type: field.type
      };
    });

    // Transform content values to the format expected by the database
    const updates: Array<{ fieldId: string; content: any }> = [];
    
    const processContentRecursively = (values: Record<string, any>) => {
      Object.entries(values).forEach(([fieldId, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
            Object.keys(value).some(key => typeof value[key] !== 'object' || Array.isArray(value[key]))) {
          // This looks like nested section content
          processContentRecursively(value);
        } else {
          // This is a regular field value
          const fieldType = fieldTypeMap[fieldId];
          if (fieldType && fieldType !== 'section') {
            const formattedContent = formatContentForFieldType(fieldType, value);
            updates.push({
              fieldId,
              content: formattedContent
            });
          }
        }
      });
    };

    processContentRecursively(contentValues);

    // Update each field's content in the database
    const updatePromises = updates.map(async ({ fieldId, content }) => {
      const fieldInfo = fieldInfoMap[fieldId];
      if (!fieldInfo) {
        console.error(`Field info not found for ${fieldId}`);
        return;
      }
      
      const { error } = await supabase
        .from('cms_content_fields')
        .upsert({ 
          id: fieldId,
          name: fieldInfo.name,
          section_id: fieldInfo.section_id,
          type: fieldInfo.type as "number" | "boolean" | "text" | "date" | "richtext" | "image" | "reference",
          content: content 
        }, { onConflict: 'id' });
      
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

export async function loadPageContent(pageId: string) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get all fields for this page with their content and type information
    const { data: fields, error } = await supabase
      .from('cms_content_fields')
      .select(`
        id,
        type,
        content,
        cms_sections!inner(page_id)
      `)
      .eq('cms_sections.page_id', pageId);

    if (error) {
      throw error;
    }

    // Transform the content back to the format expected by the store
    const contentValues: Record<string, any> = {};
    
    fields?.forEach(field => {
      if (field.content !== null) {
        contentValues[field.id] = extractValueFromContent(field.type, field.content);
      }
      // If content is null, don't add to contentValues (will use default value)
    });

    return { contentValues };
  } catch (error) {
    console.error("Error loading content:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to load content");
  }
}

