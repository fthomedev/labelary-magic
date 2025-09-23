export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      file_access_tokens: {
        Row: {
          accessed_count: number
          bucket_name: string
          created_at: string
          expires_at: string
          file_path: string
          id: string
          max_access: number | null
          token: string
          user_id: string
        }
        Insert: {
          accessed_count?: number
          bucket_name?: string
          created_at?: string
          expires_at?: string
          file_path: string
          id?: string
          max_access?: number | null
          token: string
          user_id: string
        }
        Update: {
          accessed_count?: number
          bucket_name?: string
          created_at?: string
          expires_at?: string
          file_path?: string
          id?: string
          max_access?: number | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      history_usage_survey: {
        Row: {
          created_at: string
          id: string
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_history: {
        Row: {
          date: string
          id: string
          label_count: number
          pdf_path: string | null
          pdf_url: string
          processing_time: number | null
          processing_type: string | null
          removed_at: string | null
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          label_count: number
          pdf_path?: string | null
          pdf_url: string
          processing_time?: number | null
          processing_type?: string | null
          removed_at?: string | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          label_count?: number
          pdf_path?: string | null
          pdf_url?: string
          processing_time?: number | null
          processing_type?: string | null
          removed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      processing_logs: {
        Row: {
          api_response_body: string | null
          api_response_status: number | null
          created_at: string
          error_message: string | null
          id: string
          label_number: number
          processing_time_ms: number
          status: string
          user_id: string | null
          validation_warnings: Json | null
          zpl_content: string
        }
        Insert: {
          api_response_body?: string | null
          api_response_status?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          label_number: number
          processing_time_ms: number
          status: string
          user_id?: string | null
          validation_warnings?: Json | null
          zpl_content: string
        }
        Update: {
          api_response_body?: string | null
          api_response_status?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          label_number?: number
          processing_time_ms?: number
          status?: string
          user_id?: string | null
          validation_warnings?: Json | null
          zpl_content?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string | null
          quantity: number | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          usage_count: number | null
          usage_quota: number | null
          usage_reset_date: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_quota?: number | null
          usage_reset_date?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_quota?: number | null
          usage_reset_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_file_access_token: {
        Args: {
          p_bucket_name?: string
          p_expires_hours?: number
          p_file_path: string
          p_max_access?: number
        }
        Returns: string
      }
      delete_old_file: {
        Args: { record_id: string }
        Returns: undefined
      }
      delete_processing_history_record: {
        Args: { record_id: string }
        Returns: Json
      }
      delete_storage_and_mark: {
        Args: { id_input: string }
        Returns: undefined
      }
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_secure_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      insert_processing_history: {
        Args:
          | Record<PropertyKey, never>
          | { p_file_name: string; p_status: string }
          | {
              p_label_count: number
              p_pdf_path?: string
              p_pdf_url: string
              p_user_id: string
            }
        Returns: undefined
      }
      reset_daily_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
