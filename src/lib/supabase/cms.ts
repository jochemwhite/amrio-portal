import { createClient } from './supabaseClient';
import { Section, Field, Page, SupabaseSection, SupabaseField, SupabasePage, PageStatus } from '@/types/cms';

// Get client-side Supabase client
const supabase = createClient();

export const cmsAPI = {
  // Section operations
  async getSections(): Promise<Section[]> {
    // @ts-ignore - CMS tables not yet in generated types
    const { data: sections, error: sectionsError } = await supabase
      .from('cms_sections')
      .select('*')
      .order('order', { ascending: true });

    if (sectionsError) throw sectionsError;

    // @ts-ignore - CMS tables not yet in generated types
    const { data: fields, error: fieldsError } = await supabase
      .from('cms_fields')
      .select('*')
      .order('order', { ascending: true });

    if (fieldsError) throw fieldsError;

    // Group fields by section
    const sectionsWithFields: Section[] = (sections || []).map((section: any) => ({
      id: section.id,
      name: section.name,
      description: section.description,
      fields: (fields || [])
        .filter((field: any) => field.section_id === section.id)
        .map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required,
          defaultValue: field.default_value,
          validation: field.validation,
          order: field.order,
        })),
    }));

    return sectionsWithFields;
  },

  async createSection(name: string, description?: string): Promise<Section> {
    // @ts-ignore - CMS tables not yet in generated types
    const { data, error } = await supabase
      .from('cms_sections')
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fields: [],
    };
  },

  async updateSection(id: string, updates: Partial<SupabaseSection>): Promise<void> {
    // @ts-ignore - CMS tables not yet in generated types
    const { error } = await supabase
      .from('cms_sections')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteSection(id: string): Promise<void> {
    // Delete associated fields first (cascading delete)
    // @ts-ignore - CMS tables not yet in generated types
    const { error: fieldsError } = await supabase
      .from('cms_fields')
      .delete()
      .eq('section_id', id);

    if (fieldsError) throw fieldsError;

    // Delete the section
    // @ts-ignore - CMS tables not yet in generated types
    const { error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Field operations
  async createField(sectionId: string, field: Omit<Field, 'id'>): Promise<Field> {
    const { data, error } = await supabase
      .from('cms_fields')
      .insert({
        section_id: sectionId,
        name: field.name,
        type: field.type,
        required: field.required,
        default_value: field.defaultValue,
        validation: field.validation,
        order: field.order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      required: data.required,
      defaultValue: data.default_value,
      validation: data.validation,
      order: data.order,
    };
  },

  async updateField(fieldId: string, updates: Partial<Field>): Promise<void> {
    const dbUpdates: Partial<SupabaseField> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.required !== undefined) dbUpdates.required = updates.required;
    if (updates.defaultValue !== undefined) dbUpdates.default_value = updates.defaultValue;
    if (updates.validation !== undefined) dbUpdates.validation = updates.validation;
    if (updates.order !== undefined) dbUpdates.order = updates.order;

    const { error } = await supabase
      .from('cms_fields')
      .update(dbUpdates)
      .eq('id', fieldId);

    if (error) throw error;
  },

  async deleteField(fieldId: string): Promise<void> {
    const { error } = await supabase
      .from('cms_fields')
      .delete()
      .eq('id', fieldId);

    if (error) throw error;
  },

  async reorderFields(sectionId: string, fields: Field[]): Promise<void> {
    // Update all fields with new order
    const updates = fields.map((field, index) => ({
      id: field.id,
      order: index,
    }));

    for (const update of updates) {
      await this.updateField(update.id, { order: update.order });
    }
  },

  async saveSchema(sections: Section[]): Promise<void> {
    // This is a simplified implementation
    // In a real app, you might want to use a transaction
    
    // Clear existing data
    await supabase.from('cms_fields').delete().neq('id', '');
    await supabase.from('cms_sections').delete().neq('id', '');

    // Insert sections and fields
    for (const section of sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('cms_sections')
        .insert({
          id: section.id,
          name: section.name,
          description: section.description,
        })
        .select()
        .single();

      if (sectionError) throw sectionError;

      // Insert fields for this section
      for (const field of section.fields) {
        const { error: fieldError } = await supabase
          .from('cms_fields')
          .insert({
            id: field.id,
            section_id: section.id,
            name: field.name,
            type: field.type,
            required: field.required,
            default_value: field.defaultValue,
            validation: field.validation,
            order: field.order || 0,
          });

        if (fieldError) throw fieldError;
      }
    }
  },
}; 