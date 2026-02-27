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
      campaigns: {
        Row: {
          ad_spend: number | null
          color: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          pixel_code: string | null
          products: string[] | null
          slug: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          ad_spend?: number | null
          color?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pixel_code?: string | null
          products?: string[] | null
          slug: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_spend?: number | null
          color?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pixel_code?: string | null
          products?: string[] | null
          slug?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fb_ads: {
        Row: {
          created_at: string | null
          created_time: string | null
          creative_id: string | null
          creative_name: string | null
          creative_preview_url: string | null
          fb_ad_id: string
          fb_adset_id: string
          fb_campaign_id: string
          id: string
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          created_at?: string | null
          created_time?: string | null
          creative_id?: string | null
          creative_name?: string | null
          creative_preview_url?: string | null
          fb_ad_id: string
          fb_adset_id: string
          fb_campaign_id: string
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          created_at?: string | null
          created_time?: string | null
          creative_id?: string | null
          creative_name?: string | null
          creative_preview_url?: string | null
          fb_ad_id?: string
          fb_adset_id?: string
          fb_campaign_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: []
      }
      fb_ads_config: {
        Row: {
          access_token: string
          ad_account_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          ad_account_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          ad_account_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fb_adsets: {
        Row: {
          bid_amount: number | null
          billing_event: string | null
          created_at: string | null
          created_time: string | null
          daily_budget: number | null
          fb_adset_id: string
          fb_campaign_id: string
          id: string
          lifetime_budget: number | null
          metadata: Json | null
          name: string
          optimization_goal: string | null
          status: string | null
          targeting: Json | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          bid_amount?: number | null
          billing_event?: string | null
          created_at?: string | null
          created_time?: string | null
          daily_budget?: number | null
          fb_adset_id: string
          fb_campaign_id: string
          id?: string
          lifetime_budget?: number | null
          metadata?: Json | null
          name: string
          optimization_goal?: string | null
          status?: string | null
          targeting?: Json | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          bid_amount?: number | null
          billing_event?: string | null
          created_at?: string | null
          created_time?: string | null
          daily_budget?: number | null
          fb_adset_id?: string
          fb_campaign_id?: string
          id?: string
          lifetime_budget?: number | null
          metadata?: Json | null
          name?: string
          optimization_goal?: string | null
          status?: string | null
          targeting?: Json | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: []
      }
      fb_campaigns: {
        Row: {
          campaign_slug: string | null
          created_at: string | null
          created_time: string | null
          daily_budget: number | null
          fb_campaign_id: string
          id: string
          lifetime_budget: number | null
          metadata: Json | null
          name: string
          objective: string | null
          start_time: string | null
          status: string | null
          stop_time: string | null
          updated_at: string | null
          updated_time: string | null
        }
        Insert: {
          campaign_slug?: string | null
          created_at?: string | null
          created_time?: string | null
          daily_budget?: number | null
          fb_campaign_id: string
          id?: string
          lifetime_budget?: number | null
          metadata?: Json | null
          name: string
          objective?: string | null
          start_time?: string | null
          status?: string | null
          stop_time?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Update: {
          campaign_slug?: string | null
          created_at?: string | null
          created_time?: string | null
          daily_budget?: number | null
          fb_campaign_id?: string
          id?: string
          lifetime_budget?: number | null
          metadata?: Json | null
          name?: string
          objective?: string | null
          start_time?: string | null
          status?: string | null
          stop_time?: string | null
          updated_at?: string | null
          updated_time?: string | null
        }
        Relationships: []
      }
      fb_metrics: {
        Row: {
          clicks: number | null
          conversions: number | null
          cost_per_conversion: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date_start: string
          date_stop: string
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          frequency: number | null
          id: string
          impressions: number | null
          metadata: Json | null
          reach: number | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start: string
          date_stop: string
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json | null
          reach?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json | null
          reach?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          current_value: number | null
          description: string | null
          end_date: string
          id: string
          metric_type: string
          name: string
          period_type: string
          product_slug: string | null
          start_date: string
          status: string | null
          target_value: number
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          end_date: string
          id?: string
          metric_type: string
          name: string
          period_type: string
          product_slug?: string | null
          start_date: string
          status?: string | null
          target_value: number
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string
          id?: string
          metric_type?: string
          name?: string
          period_type?: string
          product_slug?: string | null
          start_date?: string
          status?: string | null
          target_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          column_mapping: Json | null
          completed_at: string | null
          created_at: string | null
          duplicates_found: number | null
          error_details: Json | null
          errors: number | null
          filename: string
          id: string
          imported_rows: number | null
          status: string | null
          tags_created: string[] | null
          total_rows: number | null
        }
        Insert: {
          column_mapping?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duplicates_found?: number | null
          error_details?: Json | null
          errors?: number | null
          filename: string
          id?: string
          imported_rows?: number | null
          status?: string | null
          tags_created?: string[] | null
          total_rows?: number | null
        }
        Update: {
          column_mapping?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duplicates_found?: number | null
          error_details?: Json | null
          errors?: number | null
          filename?: string
          id?: string
          imported_rows?: number | null
          status?: string | null
          tags_created?: string[] | null
          total_rows?: number | null
        }
        Relationships: []
      }
      invoice_requests: {
        Row: {
          created_at: string | null
          description: string
          id: string
          issued_at: string | null
          lead_cpf: string | null
          lead_email: string | null
          lead_id: string
          lead_name: string | null
          lead_phone: string | null
          notes: string | null
          purchase_id: string | null
          sent_at: string | null
          status: string
          value: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          issued_at?: string | null
          lead_cpf?: string | null
          lead_email?: string | null
          lead_id: string
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          purchase_id?: string | null
          sent_at?: string | null
          status?: string
          value: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          issued_at?: string | null
          lead_cpf?: string | null
          lead_email?: string | null
          lead_id?: string
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          purchase_id?: string | null
          sent_at?: string | null
          status?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "invoice_requests_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          lead_id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          lead_id: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          lead_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      lead_merge_logs: {
        Row: {
          conflict_fields: string[] | null
          created_at: string | null
          id: string
          master_lead_id: string
          merge_reason: string
          merged_data: Json
          merged_lead_id: string
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          conflict_fields?: string[] | null
          created_at?: string | null
          id?: string
          master_lead_id: string
          merge_reason: string
          merged_data?: Json
          merged_lead_id: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          conflict_fields?: string[] | null
          created_at?: string | null
          id?: string
          master_lead_id?: string
          merge_reason?: string
          merged_data?: Json
          merged_lead_id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_merge_logs_master_lead_id_fkey"
            columns: ["master_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          source: string | null
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          source?: string | null
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          source?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_versions: {
        Row: {
          change_summary: string | null
          changed_at: string | null
          changed_by: string | null
          data: Json
          id: string
          lead_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by?: string | null
          data?: Json
          id?: string
          lead_id: string
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by?: string | null
          data?: Json
          id?: string
          lead_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_versions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      leads: {
        Row: {
          birth_date: string | null
          city: string | null
          client_type: string | null
          complement: string | null
          country: string | null
          cpf: string | null
          created_at: string | null
          crm_status: string | null
          email: string | null
          gender: string | null
          id: string
          lead_id: string
          metadata: Json | null
          name: string | null
          neighborhood: string | null
          phone: string | null
          project_slug: string | null
          region: string | null
          source: string | null
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          zip_code: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          client_type?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          crm_status?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          project_slug?: string | null
          region?: string | null
          source?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zip_code?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          client_type?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string | null
          crm_status?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          project_slug?: string | null
          region?: string | null
          source?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      product_offers: {
        Row: {
          created_at: string | null
          hotmart_code: string
          id: string
          is_active: boolean | null
          offer_name: string
          offer_price: number | null
          offer_type: string | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hotmart_code: string
          id?: string
          is_active?: boolean | null
          offer_name: string
          offer_price?: number | null
          offer_type?: string | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hotmart_code?: string
          id?: string
          is_active?: boolean | null
          offer_name?: string
          offer_price?: number | null
          offer_type?: string | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number
          slug: string
          type: string
          color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number
          slug: string
          type: string
          color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          slug?: string
          type?: string
          color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          commission: number | null
          created_at: string | null
          currency: string | null
          gross_value: number | null
          id: string
          installments: number | null
          is_recurring: boolean | null
          lead_id: string
          metadata: Json | null
          payment_method: string | null
          platform: string | null
          product_code: string | null
          product_name: string
          product_slug: string | null
          project_slug: string | null
          purchase_date: string | null
          source: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          utm_campaign: string | null
          utm_source: string | null
          value: number | null
        }
        Insert: {
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          gross_value?: number | null
          id?: string
          installments?: number | null
          is_recurring?: boolean | null
          lead_id: string
          metadata?: Json | null
          payment_method?: string | null
          platform?: string | null
          product_code?: string | null
          product_name: string
          product_slug?: string | null
          project_slug?: string | null
          purchase_date?: string | null
          source?: string | null
          status: string
          subscription_id?: string | null
          transaction_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          value?: number | null
        }
        Update: {
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          gross_value?: number | null
          id?: string
          installments?: number | null
          is_recurring?: boolean | null
          lead_id?: string
          metadata?: Json | null
          payment_method?: string | null
          platform?: string | null
          product_code?: string | null
          product_name?: string
          product_slug?: string | null
          project_slug?: string | null
          purchase_date?: string | null
          source?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          lead_id: string
          survey_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          id?: string
          lead_id: string
          survey_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          lead_id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          questions: Json | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          source: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          source?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          source?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email: string
          expires_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          lead_id: string | null
          payload: Json
          processed: boolean | null
          source: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          lead_id?: string | null
          payload: Json
          processed?: boolean | null
          source: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json
          processed?: boolean | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_email: { Args: { email_input: string }; Returns: string }
      normalize_phone: { Args: { phone_input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "commercial" | "financial" | "support"
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
    Enums: {
      app_role: ["admin", "commercial", "financial", "support"],
    },
  },
} as const
