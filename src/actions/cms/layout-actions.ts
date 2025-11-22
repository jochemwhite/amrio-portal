"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantId } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { 
  LayoutTemplate, 
  LayoutAssignment, 
  PageLayoutOverride,
  ResolvedPageLayout,
  LayoutTemplateType,
  LayoutConditionType,
  LayoutTemplateWithRelations
} from "@/types/cms";
import { revalidatePath } from "next/cache";

// ============================================
// LAYOUT TEMPLATE MANAGEMENT
// ============================================

interface CreateLayoutTemplateData {
  name: string;
  type: LayoutTemplateType;
  description?: string;
  schema_id: string;
  website_id: string;
  is_default?: boolean;
}

export async function createLayoutTemplate(
  data: CreateLayoutTemplateData
): Promise<ActionResponse<LayoutTemplate>> {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create layout templates." };
  }

  try {
    // If this is set as default, unset other defaults of the same type for this website
    if (data.is_default) {
      await supabase
        .from("cms_layout_templates")
        .update({ is_default: false })
        .eq("website_id", data.website_id)
        .eq("type", data.type)
        .eq("is_default", true);
    }

    const { data: template, error } = await supabase
      .from("cms_layout_templates")
      .insert({
        ...data,
        tenant_id: tenantId,
        is_default: data.is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating layout template:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/websites/${data.website_id}/layouts`);
    return { success: true, data: template as LayoutTemplate };
  } catch (error) {
    console.error("Unexpected error creating layout template:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

interface UpdateLayoutTemplateData {
  name?: string;
  description?: string;
  is_default?: boolean;
}

export async function updateLayoutTemplate(
  templateId: string,
  data: UpdateLayoutTemplateData
): Promise<ActionResponse<LayoutTemplate>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update layout templates." };
  }

  try {
    // Get current template to check website_id and type
    const { data: currentTemplate } = await supabase
      .from("cms_layout_templates")
      .select("website_id, type")
      .eq("id", templateId)
      .single();

    // If setting as default, unset other defaults
    if (data.is_default && currentTemplate) {
      await supabase
        .from("cms_layout_templates")
        .update({ is_default: false })
        .eq("website_id", currentTemplate.website_id)
        .eq("type", currentTemplate.type)
        .eq("is_default", true)
        .neq("id", templateId);
    }

    const { data: template, error } = await supabase
      .from("cms_layout_templates")
      .update(data)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("Error updating layout template:", error);
      return { success: false, error: error.message };
    }

    if (currentTemplate) {
      revalidatePath(`/dashboard/websites/${currentTemplate.website_id}/layouts`);
    }
    
    return { success: true, data: template as LayoutTemplate };
  } catch (error) {
    console.error("Unexpected error updating layout template:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteLayoutTemplate(templateId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete layout templates." };
  }

  try {
    // Get website_id for revalidation before deleting
    const { data: template } = await supabase
      .from("cms_layout_templates")
      .select("website_id")
      .eq("id", templateId)
      .single();

    const { error } = await supabase.from("cms_layout_templates").delete().eq("id", templateId);

    if (error) {
      console.error("Error deleting layout template:", error);
      return { success: false, error: error.message };
    }

    if (template) {
      revalidatePath(`/dashboard/websites/${template.website_id}/layouts`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting layout template:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getLayoutTemplatesByWebsite(
  websiteId: string,
  type?: LayoutTemplateType
): Promise<ActionResponse<LayoutTemplate[]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    let query = supabase
      .from("cms_layout_templates")
      .select("*")
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching layout templates:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: templates as LayoutTemplate[] };
  } catch (error) {
    console.error("Unexpected error fetching layout templates:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getLayoutTemplateById(
  templateId: string
): Promise<ActionResponse<LayoutTemplate>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: template, error } = await supabase
      .from("cms_layout_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      console.error("Error fetching layout template:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: template as LayoutTemplate };
  } catch (error) {
    console.error("Unexpected error fetching layout template:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============================================
// LAYOUT ASSIGNMENT MANAGEMENT
// ============================================

interface CreateLayoutAssignmentData {
  template_id: string;
  website_id: string;
  condition_type: LayoutConditionType;
  condition_value: any;
  priority?: number;
}

export async function createLayoutAssignment(
  data: CreateLayoutAssignmentData
): Promise<ActionResponse<LayoutAssignment>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create layout assignments." };
  }

  try {
    // Get the highest priority for this website if not provided
    if (data.priority === undefined) {
      const { data: maxPriority } = await supabase
        .from("cms_layout_assignments")
        .select("priority")
        .eq("website_id", data.website_id)
        .order("priority", { ascending: false })
        .limit(1)
        .single();

      data.priority = maxPriority ? maxPriority.priority + 1 : 0;
    }

    const { data: assignment, error } = await supabase
      .from("cms_layout_assignments")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating layout assignment:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/websites/${data.website_id}/layouts`);
    return { success: true, data: assignment as LayoutAssignment };
  } catch (error) {
    console.error("Unexpected error creating layout assignment:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

interface UpdateLayoutAssignmentData {
  condition_type?: LayoutConditionType;
  condition_value?: any;
  priority?: number;
}

export async function updateLayoutAssignment(
  assignmentId: string,
  data: UpdateLayoutAssignmentData
): Promise<ActionResponse<LayoutAssignment>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update layout assignments." };
  }

  try {
    const { data: assignment, error } = await supabase
      .from("cms_layout_assignments")
      .update(data)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating layout assignment:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: assignment as LayoutAssignment };
  } catch (error) {
    console.error("Unexpected error updating layout assignment:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteLayoutAssignment(assignmentId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete layout assignments." };
  }

  try {
    const { error } = await supabase.from("cms_layout_assignments").delete().eq("id", assignmentId);

    if (error) {
      console.error("Error deleting layout assignment:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting layout assignment:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getLayoutAssignmentsByWebsite(
  websiteId: string
): Promise<ActionResponse<LayoutAssignment[]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: assignments, error } = await supabase
      .from("cms_layout_assignments")
      .select("*")
      .eq("website_id", websiteId)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching layout assignments:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: assignments as LayoutAssignment[] };
  } catch (error) {
    console.error("Unexpected error fetching layout assignments:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============================================
// PAGE LAYOUT OVERRIDE MANAGEMENT
// ============================================

interface SetPageLayoutOverrideData {
  page_id: string;
  header_template_id?: string | null;
  footer_template_id?: string | null;
}

export async function setPageLayoutOverride(
  data: SetPageLayoutOverrideData
): Promise<ActionResponse<PageLayoutOverride>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can set page layout overrides." };
  }

  try {
    // Use upsert to handle both insert and update
    const { data: override, error } = await supabase
      .from("cms_page_layout_overrides")
      .upsert(
        {
          page_id: data.page_id,
          header_template_id: data.header_template_id,
          footer_template_id: data.footer_template_id,
        },
        { onConflict: "page_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error setting page layout override:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/pages/${data.page_id}`);
    return { success: true, data: override as PageLayoutOverride };
  } catch (error) {
    console.error("Unexpected error setting page layout override:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function clearPageLayoutOverride(pageId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can clear page layout overrides." };
  }

  try {
    const { error } = await supabase
      .from("cms_page_layout_overrides")
      .delete()
      .eq("page_id", pageId);

    if (error) {
      console.error("Error clearing page layout override:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error clearing page layout override:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getPageLayoutOverride(
  pageId: string
): Promise<ActionResponse<PageLayoutOverride | null>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: override, error } = await supabase
      .from("cms_page_layout_overrides")
      .select("*")
      .eq("page_id", pageId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching page layout override:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: override as PageLayoutOverride | null };
  } catch (error) {
    console.error("Unexpected error fetching page layout override:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============================================
// RESOLVED LAYOUT MANAGEMENT
// ============================================

export async function getResolvedPageLayout(
  pageId: string
): Promise<ActionResponse<ResolvedPageLayout>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data, error } = await supabase.rpc("get_page_layout", {
      page_id_param: pageId,
    });

    if (error) {
      console.error("Error fetching resolved page layout:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ResolvedPageLayout };
  } catch (error) {
    console.error("Unexpected error fetching resolved page layout:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// Helper function to get template with content using RPC
export async function getTemplateWithContent(templateId: string): Promise<ActionResponse<any>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data, error } = await supabase.rpc("get_template_with_content", {
      template_id_param: templateId,
    });

    if (error) {
      console.error("Error fetching template with content:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching template with content:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============================================
// LAYOUT TEMPLATE CONTENT MANAGEMENT
// ============================================

export async function saveLayoutTemplateContent(
  templateId: string,
  updatedFieldsJSON: string
): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can save layout template content." };
  }

  try {
    const updatedFields = JSON.parse(updatedFieldsJSON);

    // Process each field update
    for (const field of updatedFields) {
      const { schema_field_id, content, content_field_id } = field;

      if (content_field_id) {
        // Update existing content
        await supabase
          .from("cms_layout_template_content")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", content_field_id);
      } else {
        // Insert new content
        await supabase.from("cms_layout_template_content").insert({
          template_id: templateId,
          schema_field_id,
          content,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving layout template content:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ============================================
// CONSOLIDATED LAYOUTS VIEW
// ============================================

export interface LayoutRow {
  id: string;
  template_id: string;
  template_name: string;
  template_description: string | null;
  type: LayoutTemplateType;
  schema_id: string;
  schema_name: string;
  is_default: boolean;
  assignment_type: 'default' | 'assignment' | 'override';
  // For assignments
  assignment_id?: string;
  condition_type?: LayoutConditionType;
  condition_value?: any;
  priority?: number;
  // For overrides
  override_id?: string;
  page_id?: string;
  page_name?: string;
  page_slug?: string;
  created_at: string;
  updated_at: string;
}

export async function getAllLayoutsForWebsite(
  websiteId: string
): Promise<ActionResponse<LayoutRow[]>> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const rows: LayoutRow[] = [];

    // 1. Get all layout templates for this website with schema info
    const { data: templates, error: templatesError } = await supabase
      .from("cms_layout_templates")
      .select(`
        id,
        name,
        description,
        type,
        schema_id,
        is_default,
        created_at,
        updated_at,
        cms_schemas!inner(
          id,
          name
        )
      `)
      .eq("website_id", websiteId)
      .order("type")
      .order("name");

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      return { success: false, error: templatesError.message };
    }

    if (!templates || templates.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Get all assignments for these templates
    const templateIds = templates.map(t => t.id);
    const { data: assignments, error: assignmentsError } = await supabase
      .from("cms_layout_assignments")
      .select("*")
      .in("template_id", templateIds)
      .order("priority", { ascending: false });

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
      return { success: false, error: assignmentsError.message };
    }

    // 3. Get all page overrides with page info
    const { data: overrides, error: overridesError } = await supabase
      .from("cms_page_layout_overrides")
      .select(`
        id,
        page_id,
        header_template_id,
        footer_template_id,
        created_at,
        cms_pages!inner(
          id,
          name,
          slug,
          website_id
        )
      `)
      .eq("cms_pages.website_id", websiteId);

    if (overridesError) {
      console.error("Error fetching overrides:", overridesError);
      return { success: false, error: overridesError.message };
    }

    // 4. Build rows - prioritize defaults first
    for (const template of templates) {
      const schema = Array.isArray(template.cms_schemas) 
        ? template.cms_schemas[0] 
        : template.cms_schemas;

      // Add default row if this is a default template
      if (template.is_default) {
        rows.push({
          id: `default-${template.id}`,
          template_id: template.id,
          template_name: template.name,
          template_description: template.description,
          type: template.type as LayoutTemplateType,
          schema_id: template.schema_id,
          schema_name: schema.name,
          is_default: true,
          assignment_type: 'default',
          created_at: template.created_at,
          updated_at: template.updated_at,
        });
      }

      // Add assignment rows
      const templateAssignments = assignments?.filter(a => a.template_id === template.id) || [];
      for (const assignment of templateAssignments) {
        rows.push({
          id: `assignment-${assignment.id}`,
          template_id: template.id,
          template_name: template.name,
          template_description: template.description,
          type: template.type as LayoutTemplateType,
          schema_id: template.schema_id,
          schema_name: schema.name,
          is_default: false,
          assignment_type: 'assignment',
          assignment_id: assignment.id,
          condition_type: assignment.condition_type as LayoutConditionType,
          condition_value: assignment.condition_value,
          priority: assignment.priority,
          created_at: assignment.created_at,
          updated_at: template.updated_at,
        });
      }

      // Add override rows
      if (overrides) {
        for (const override of overrides) {
          const page = Array.isArray(override.cms_pages)
            ? override.cms_pages[0]
            : override.cms_pages;

          // Check if this template is used in the override
          const isHeaderOverride = override.header_template_id === template.id;
          const isFooterOverride = override.footer_template_id === template.id;

          if (isHeaderOverride || isFooterOverride) {
            rows.push({
              id: `override-${override.id}-${template.id}`,
              template_id: template.id,
              template_name: template.name,
              template_description: template.description,
              type: template.type as LayoutTemplateType,
              schema_id: template.schema_id,
              schema_name: schema.name,
              is_default: false,
              assignment_type: 'override',
              override_id: override.id,
              page_id: page.id,
              page_name: page.name,
              page_slug: page.slug,
              created_at: override.created_at,
              updated_at: template.updated_at,
            });
          }
        }
      }
    }

    // Sort: defaults first, then assignments by priority, then overrides
    rows.sort((a, b) => {
      if (a.assignment_type === 'default' && b.assignment_type !== 'default') return -1;
      if (a.assignment_type !== 'default' && b.assignment_type === 'default') return 1;
      if (a.assignment_type === 'assignment' && b.assignment_type === 'override') return -1;
      if (a.assignment_type === 'override' && b.assignment_type === 'assignment') return 1;
      if (a.assignment_type === 'assignment' && b.assignment_type === 'assignment') {
        return (b.priority || 0) - (a.priority || 0);
      }
      return a.template_name.localeCompare(b.template_name);
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error("Unexpected error fetching layouts:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}


