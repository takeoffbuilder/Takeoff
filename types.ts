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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          address: string
          address2: string | null
          affiliate_status: string | null
          city: string
          country: string
          created_at: string | null
          dob: string
          email: string
          first_name: string
          id: string
          last_name: string
          payout_setup_complete: boolean | null
          phone: string | null
          postal_code: string
          ssn_last_four: string
          state: string
          stripe_account: string
          stripe_onboarding_url: string | null
        }
        Insert: {
          address: string
          address2?: string | null
          affiliate_status?: string | null
          city: string
          country?: string
          created_at?: string | null
          dob: string
          email: string
          first_name: string
          id: string
          last_name: string
          payout_setup_complete?: boolean | null
          phone?: string | null
          postal_code: string
          ssn_last_four: string
          state: string
          stripe_account: string
          stripe_onboarding_url?: string | null
        }
        Update: {
          address?: string
          address2?: string | null
          affiliate_status?: string | null
          city?: string
          country?: string
          created_at?: string | null
          dob?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          payout_setup_complete?: boolean | null
          phone?: string | null
          postal_code?: string
          ssn_last_four?: string
          state?: string
          stripe_account?: string
          stripe_onboarding_url?: string | null
        }
        Relationships: []
      }
      booster_plans: {
        Row: {
          created_at: string | null
          credit_limit: number
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          monthly_amount: number
          plan_name: string
          plan_slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_limit: number
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_amount: number
          plan_name: string
          plan_slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_limit?: number
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_amount?: number
          plan_name?: string
          plan_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          filename: string
          id: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          filename: string
          id?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          filename?: string
          id?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      downloaded_courses: {
        Row: {
          course_slug: string
          course_title: string
          downloaded_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_slug: string
          course_title: string
          downloaded_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_slug?: string
          course_title?: string
          downloaded_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booster_account_id: string | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          payment_date: string | null
          payment_method_id: string | null
          payment_type: string
          plan_slug: string | null
          status: string
          stripe_checkout_id: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          booster_account_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payment_date?: string | null
          payment_method_id?: string | null
          payment_type: string
          plan_slug?: string | null
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          booster_account_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payment_date?: string | null
          payment_method_id?: string | null
          payment_type?: string
          plan_slug?: string | null
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booster_account_id_fkey"
            columns: ["booster_account_id"]
            isOneToOne: false
            referencedRelation: "user_booster_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address2: string | null
          city: string | null
          country: string
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_affiliate: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          referral_code: string | null
          state: string | null
          status: string | null
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          stripe_email: string | null
          stripe_name: string | null
          stripe_onboarding_url: string | null
          total_signups: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address2?: string | null
          city?: string | null
          country?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_affiliate?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          referral_code?: string | null
          state?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_email?: string | null
          stripe_name?: string | null
          stripe_onboarding_url?: string | null
          total_signups?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address2?: string | null
          city?: string | null
          country?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_affiliate?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          referral_code?: string | null
          state?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_email?: string | null
          stripe_name?: string | null
          stripe_onboarding_url?: string | null
          total_signups?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_payouts: {
        Row: {
          amount: number
          conversions: number
          created_at: string
          id: number
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          referrer_id: string
          status: string
        }
        Insert: {
          amount?: number
          conversions?: number
          created_at?: string
          id?: number
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          referrer_id: string
          status?: string
        }
        Update: {
          amount?: number
          conversions?: number
          created_at?: string
          id?: number
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payouts_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referred_users: {
        Row: {
          conversion_at: string | null
          converted: boolean
          id: string
          metadata: Json | null
          paid_at: string | null
          payout_amount: number | null
          payout_status: string
          plan_slug: string | null
          referral_code: string
          referred_user_id: string | null
          referrer_id: string | null
          signup_at: string
        }
        Insert: {
          conversion_at?: string | null
          converted?: boolean
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payout_amount?: number | null
          payout_status?: string
          plan_slug?: string | null
          referral_code: string
          referred_user_id?: string | null
          referrer_id?: string | null
          signup_at?: string
        }
        Update: {
          conversion_at?: string | null
          converted?: boolean
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payout_amount?: number | null
          payout_status?: string
          plan_slug?: string | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string | null
          signup_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referred_users_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_booster_accounts: {
        Row: {
          closed_at: string | null
          consumer_account_id: number | null
          created_at: string | null
          credit_limit: number
          date_added: string | null
          date_cancelled: string | null
          highest_credit_limit: number | null
          id: string
          monthly_amount: number
          next_payment_date: string | null
          plan_id: string
          plan_slug: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          consumer_account_id?: number | null
          created_at?: string | null
          credit_limit: number
          date_added?: string | null
          date_cancelled?: string | null
          highest_credit_limit?: number | null
          id?: string
          monthly_amount: number
          next_payment_date?: string | null
          plan_id: string
          plan_slug?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          consumer_account_id?: number | null
          created_at?: string | null
          credit_limit?: number
          date_added?: string | null
          date_cancelled?: string | null
          highest_credit_limit?: number | null
          id?: string
          monthly_amount?: number
          next_payment_date?: string | null
          plan_id?: string
          plan_slug?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_booster_accounts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "booster_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personal_info: {
        Row: {
          address: string | null
          address2: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string
          first_name: string
          generation_code: string | null
          id: string
          last_name: string
          middle_initial: string | null
          phone: string | null
          ssn_last_four: string
          state: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address2?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth: string
          first_name: string
          generation_code?: string | null
          id?: string
          last_name: string
          middle_initial?: string | null
          phone?: string | null
          ssn_last_four: string
          state?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address2?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          generation_code?: string | null
          id?: string
          last_name?: string
          middle_initial?: string | null
          phone?: string | null
          ssn_last_four?: string
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_highest_credit_limit: { Args: never; Returns: undefined }
      bump_referrer_click: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      bump_referrer_signup: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      convert_and_queue_payout: {
        Args: { p_amount: number; p_referred_user: string }
        Returns: undefined
      }
      generate_referral_code: { Args: { p_len?: number }; Returns: string }
      is_admin: { Args: { p_email: string }; Returns: boolean }
      mark_referral_converted: {
        Args: { p_referred_user: string }
        Returns: undefined
      }
      mark_referral_payout_paid: {
        Args: { p_referred_user: string }
        Returns: undefined
      }
      refresh_referral_month: {
        Args: { p_month: number; p_year: number }
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
