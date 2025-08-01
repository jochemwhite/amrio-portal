"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";
import { Section, Field, FieldType } from "@/types/cms";

interface CreateSectionData {
  page_id: string;
  name: string;
  description?: string;
  order?: number;
}

interface UpdateSectionData {
  name?: string;
  description?: string;
}

interface CreateFieldData {
  section_id: string;
  name: string;
  type: string; // Changed from FieldType to string
  required?: boolean;
  default_value?: string;
  validation?: string;
  order: number;
}

interface UpdateFieldData {
  name?: string;
  type?: string; // Changed from FieldType to string
  required?: boolean;
  default_value?: string;
  validation?: string;
  order?: number;
}

interface BulkSavePayload {
  pageId: string;
  changes: Array<{
    type: 'create' | 'update' | 'delete';
    entity: 'section' | 'field';
    id?: string;
    data?: any;
    tempId?: string;
  }>;
  sectionOrder: string[];
  fieldOrders: Record<string, string[]>; // sectionId -> fieldIds[]
}

interface BulkSaveResult {
  success: boolean;
  error?: string;
  tempIdMap: Record<string, string>; // Maps temp IDs to real IDs
}

// Section Management
export async function createSection(data: CreateSectionData): Promise<ActionResponse<Section>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create sections." };
  }

  try {
    // Get the next order value if not provided
    let order = data.order;
    if (order === undefined) {
      const { data: existingSections, error: countError } = await supabase
        .from("cms_sections")
        .select("order")
        .eq("page_id", data.page_id)
        .order("order", { ascending: false })
        .limit(1);
      
      if (countError) {
        console.error("Error getting section count:", countError);
        order = 0;
      } else {
        order = (existingSections?.[0]?.order ?? -1) + 1;
      }
    }

    const { data: section, error } = await supabase
      .from("cms_sections")
      .insert({
        page_id: data.page_id,
        name: data.name,
        description: data.description,
        order: order
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating section:", error);
      return { success: false, error: error.message };
    }

    // Convert to Section type with empty fields array
    const sectionWithFields: Section = {
      id: section.id,
      name: section.name,
      description: section.description || undefined,
      fields: []
    };

    revalidatePath("/dashboard/pages");
    return { success: true, data: sectionWithFields };
  } catch (error) {
    console.error("Unexpected error creating section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateSection(id: string, data: UpdateSectionData): Promise<ActionResponse<Section>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update sections." };
  }

  try {
    const { data: section, error } = await supabase
      .from("cms_sections")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating section:", error);
      return { success: false, error: error.message };
    }

    // Get the section with its fields
    const sectionWithFields = await getSectionWithFields(id);
    if (!sectionWithFields.success) {
      return sectionWithFields;
    }

    revalidatePath("/dashboard/pages");
    return { success: true, data: sectionWithFields.data! };
  } catch (error) {
    console.error("Unexpected error updating section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteSection(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete sections." };
  }

  try {
    const { error } = await supabase
      .from("cms_sections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting section:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/pages");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting section:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getSectionWithFields(sectionId: string): Promise<ActionResponse<Section>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    // Get section details
    const { data: section, error: sectionError } = await supabase
      .from("cms_sections")
      .select("*")
      .eq("id", sectionId)
      .single();

    if (sectionError) {
      console.error("Error fetching section:", sectionError);
      return { success: false, error: sectionError.message };
    }

    // Get fields
    const { data: fields, error: fieldsError } = await supabase
      .from("cms_fields")
      .select("*")
      .eq("section_id", sectionId)
      .order("order", { ascending: true });

    if (fieldsError) {
      console.error("Error fetching fields:", fieldsError);
      return { success: false, error: fieldsError.message };
    }

    // Transform the data to match our types
    const sectionWithFields: Section = {
      id: section.id,
      name: section.name,
      description: section.description || undefined,
      fields: fields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required ?? false,
        defaultValue: field.default_value || undefined,
        validation: field.validation || undefined,
        order: field.order ?? 0
      }))
    };

    return { success: true, data: sectionWithFields };
  } catch (error) {
    console.error("Unexpected error fetching section with fields:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// Field Management
export async function createField(data: CreateFieldData): Promise<ActionResponse<Field>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create fields." };
  }

  try {
    const { data: field, error } = await supabase
      .from("cms_fields")
      .insert({
        section_id: data.section_id,
        name: data.name,
        type: data.type as any, // Cast to bypass type checking
        required: data.required || false,
        default_value: data.default_value,
        validation: data.validation,
        order: data.order
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating field:", error);
      return { success: false, error: error.message };
    }

    // Convert to Field type
    const fieldData: Field = {
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required ?? false,
      defaultValue: field.default_value || undefined,
      validation: field.validation || undefined,
      order: field.order ?? 0
    };

    revalidatePath("/dashboard/pages");
    return { success: true, data: fieldData };
  } catch (error) {
    console.error("Unexpected error creating field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateField(id: string, data: UpdateFieldData): Promise<ActionResponse<Field>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update fields." };
  }

  try {
    // Map client data to database format
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.required !== undefined) updateData.required = data.required;
    if (data.default_value !== undefined) updateData.default_value = data.default_value;
    if (data.validation !== undefined) updateData.validation = data.validation;
    if (data.order !== undefined) updateData.order = data.order;

    const { data: field, error } = await supabase
      .from("cms_fields")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating field:", error);
      return { success: false, error: error.message };
    }

    // Convert to Field type
    const fieldData: Field = {
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required ?? false,
      defaultValue: field.default_value || undefined,
      validation: field.validation || undefined,
      order: field.order ?? 0
    };

    revalidatePath("/dashboard/pages");
    return { success: true, data: fieldData };
  } catch (error) {
    console.error("Unexpected error updating field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteField(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete fields." };
  }

  try {
    const { error } = await supabase
      .from("cms_fields")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting field:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/pages");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting field:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function reorderFields(sectionId: string, fieldIds: string[]): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can reorder fields." };
  }

  try {
    // Update order for each field
    const updates = fieldIds.map((fieldId, index) => 
      supabase
        .from("cms_fields")
        .update({ order: index })
        .eq("id", fieldId)
        .eq("section_id", sectionId)
    );

    const results = await Promise.all(updates);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error("Error reordering fields:", errors);
      return { success: false, error: "Failed to reorder some fields." };
    }

    revalidatePath("/dashboard/pages");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error reordering fields:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function reorderSections(pageId: string, sectionIds: string[]): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can reorder sections." };
  }

  try {
    // Update order for each section
    const updates = sectionIds.map((sectionId, index) => 
      supabase
        .from("cms_sections")
        .update({ order: index })
        .eq("id", sectionId)
        .eq("page_id", pageId)
    );

    const results = await Promise.all(updates);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error("Error reordering sections:", errors);
      return { success: false, error: "Failed to reorder some sections." };
    }

    revalidatePath("/dashboard/pages");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error reordering sections:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function bulkSavePageChanges(payload: BulkSavePayload): Promise<BulkSaveResult> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated.", tempIdMap: {} };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can modify sections.", tempIdMap: {} };
  }

  try {
    const tempIdMap: Record<string, string> = {};

    // Process changes in order: creates first, then updates, then deletes
    const creates = payload.changes.filter(c => c.type === 'create');
    const updates = payload.changes.filter(c => c.type === 'update');
    const deletes = payload.changes.filter(c => c.type === 'delete');

    // Process creates
    for (const change of creates) {
      if (change.entity === 'section') {
        const { data: section, error } = await supabase
          .from("cms_sections")
          .insert({
            ...change.data,
            page_id: payload.pageId,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Failed to create section: ${error.message}`);
        }
        
        if (change.tempId) {
          tempIdMap[change.tempId] = section.id;
        }
      } else if (change.entity === 'field') {
        // Replace temp section ID if it exists
        const sectionId = tempIdMap[change.data.section_id] || change.data.section_id;
        
        const { data: field, error } = await supabase
          .from("cms_fields")
          .insert({
            ...change.data,
            section_id: sectionId,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Failed to create field: ${error.message}`);
        }
        
        if (change.tempId) {
          tempIdMap[change.tempId] = field.id;
        }
      }
    }

    // Process updates
    for (const change of updates) {
      if (change.entity === 'section') {
        const { error } = await supabase
          .from("cms_sections")
          .update(change.data)
          .eq("id", change.id!);
        
        if (error) {
          throw new Error(`Failed to update section: ${error.message}`);
        }
      } else if (change.entity === 'field') {
        const { error } = await supabase
          .from("cms_fields")
          .update(change.data)
          .eq("id", change.id!);
        
        if (error) {
          throw new Error(`Failed to update field: ${error.message}`);
        }
      }
    }

    // Process deletes
    for (const change of deletes) {
      if (change.entity === 'section') {
        // Delete associated fields first
        const { error: fieldsError } = await supabase
          .from("cms_fields")
          .delete()
          .eq("section_id", change.id!);
        
        if (fieldsError) {
          throw new Error(`Failed to delete section fields: ${fieldsError.message}`);
        }
        
        // Then delete the section
        const { error: sectionError } = await supabase
          .from("cms_sections")
          .delete()
          .eq("id", change.id!);
        
        if (sectionError) {
          throw new Error(`Failed to delete section: ${sectionError.message}`);
        }
      } else if (change.entity === 'field') {
        const { error } = await supabase
          .from("cms_fields")
          .delete()
          .eq("id", change.id!);
        
        if (error) {
          throw new Error(`Failed to delete field: ${error.message}`);
        }
      }
    }

    // Handle section reordering
    const finalSectionOrder = payload.sectionOrder.map(id => tempIdMap[id] || id);
    for (let i = 0; i < finalSectionOrder.length; i++) {
      const { error } = await supabase
        .from("cms_sections")
        .update({ order: i })
        .eq("id", finalSectionOrder[i]);
      
      if (error) {
        console.warn(`Failed to update section order for ${finalSectionOrder[i]}:`, error.message);
      }
    }

    // Handle field reordering
    for (const [sectionId, fieldIds] of Object.entries(payload.fieldOrders)) {
      const finalSectionId = tempIdMap[sectionId] || sectionId;
      const finalFieldIds = fieldIds.map(id => tempIdMap[id] || id);
      
      for (let i = 0; i < finalFieldIds.length; i++) {
        const { error } = await supabase
          .from("cms_fields")
          .update({ order: i })
          .eq("id", finalFieldIds[i])
          .eq("section_id", finalSectionId);
        
        if (error) {
          console.warn(`Failed to update field order for ${finalFieldIds[i]}:`, error.message);
        }
      }
    }

    // Revalidate the path to refresh data
    revalidatePath('/dashboard');

    return {
      success: true,
      tempIdMap,
    };
  } catch (error) {
    console.error('Bulk save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tempIdMap: {},
    };
  }
}
