export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cms_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          id: string
          name: string
          order: number | null
          required: boolean | null
          section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at: string | null
          validation: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          name: string
          order?: number | null
          required?: boolean | null
          section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at?: string | null
          validation?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          name?: string
          order?: number | null
          required?: boolean | null
          section_id?: string
          type?: Database["public"]["Enums"]["field_type"]
          updated_at?: string | null
          validation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "cms_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["page_status"] | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["page_status"] | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["page_status"] | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "cms_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order: number | null
          page_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order?: number | null
          page_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order?: number | null
          page_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_websites: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string
          id: string
          name: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          name: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          name?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_websites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          error_message: string | null
          html_body: string | null
          id: string
          message_id: string | null
          origin: string
          sent_at: string
          status: string
          subject: string
          text_body: string | null
          to_address: string
        }
        Insert: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          origin?: string
          sent_at?: string
          status: string
          subject: string
          text_body?: string | null
          to_address: string
        }
        Update: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          origin?: string
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          to_address?: string
        }
        Relationships: []
      }
      global_role_types: {
        Row: {
          description: string
          id: string
          role_name: string
        }
        Insert: {
          description: string
          id?: string
          role_name: string
        }
        Update: {
          description?: string
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      moneybird: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string
          tenant_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id: string
          tenant_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string
          tenant_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          address2: string | null
          billing_slug: string | null
          business_type: string
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          id: string
          kvk_number: string | null
          logo_url: string | null
          moneybird_contact_id: string | null
          name: string
          notes: string | null
          pax8_customer_id: string | null
          phone: string | null
          postal_code: string | null
          primary_contact_user_id: string | null
          state_or_province: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address2?: string | null
          billing_slug?: string | null
          business_type: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          moneybird_contact_id?: string | null
          name: string
          notes?: string | null
          pax8_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_user_id?: string | null
          state_or_province?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address2?: string | null
          billing_slug?: string | null
          business_type?: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          moneybird_contact_id?: string | null
          name?: string
          notes?: string | null
          pax8_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_user_id?: string | null
          state_or_province?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_primary_contact_user_id_fkey"
            columns: ["primary_contact_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_roles: {
        Row: {
          created_at: string | null
          description: string | null
          global_role_type_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          global_role_type_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          global_role_type_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_roles_global_role_type_id_fkey"
            columns: ["global_role_type_id"]
            isOneToOne: false
            referencedRelation: "global_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_onboarded: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile_and_assign_role: {
        Args: {
          p_user_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role_type_id: string
        }
        Returns: boolean
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_user_session: {
        Args: Record<PropertyKey, never> | { p_uid: string }
        Returns: Json
      }
      has_global_role: {
        Args:
          | { role_name_input: string }
          | { uid: string; role_name_input: string }
        Returns: boolean
      }
      revoke_global_role: {
        Args: { user_id_input: string; role_name_input: string }
        Returns: undefined
      }
      set_system_admin: {
        Args: { user_id_input: string }
        Returns: undefined
      }
    }
    Enums: {
      field_type:
        | "text"
        | "number"
        | "boolean"
        | "date"
        | "richtext"
        | "image"
        | "reference"
      global_roles: "default_user" | "system_admin"
      page_status: "draft" | "active" | "archived"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "ended"
        | "paused"
    }
    CompositeTypes: {
      cms_role_type: {
        id: string | null
        role: string | null
      }
      tenant_role_type: {
        tenant_id: string | null
        tenant_role: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      field_type: [
        "text",
        "number",
        "boolean",
        "date",
        "richtext",
        "image",
        "reference",
      ],
      global_roles: ["default_user", "system_admin"],
      page_status: ["draft", "active", "archived"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "ended",
        "paused",
      ],
    },
  },
} as const
