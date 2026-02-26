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
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_outcomes: {
        Row: {
          company_id: string | null
          confidence: number | null
          created_at: string
          description: string | null
          detection_layer: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metric_key: string
          metric_value: number
          status: string | null
          workflow_run_id: string | null
        }
        Insert: {
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          detection_layer?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metric_key: string
          metric_value: number
          status?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          detection_layer?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metric_key?: string
          metric_value?: number
          status?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_outcomes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_outcomes_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          browser_info: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string
          id: string
          page_url: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: string | null
          company: string | null
          company_id: string
          created_at: string
          created_by_automation: boolean | null
          district: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_priority: string | null
          lead_source: string | null
          lead_stage: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          property_id: string | null
          status: string | null
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          company_id: string
          created_at?: string
          created_by_automation?: boolean | null
          district?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_priority?: string | null
          lead_source?: string | null
          lead_stage?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          company_id?: string
          created_at?: string
          created_by_automation?: boolean | null
          district?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_priority?: string | null
          lead_source?: string | null
          lead_stage?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          display_name: string | null
          domain: string | null
          id: string
          is_active: boolean
          name: string
          short_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_integrations: {
        Row: {
          api_key: string | null
          api_url: string
          company_id: string
          created_at: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_verified_at: string | null
          updated_at: string | null
          vault_secret_id: string | null
        }
        Insert: {
          api_key?: string | null
          api_url: string
          company_id: string
          created_at?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_verified_at?: string | null
          updated_at?: string | null
          vault_secret_id?: string | null
        }
        Update: {
          api_key?: string | null
          api_url?: string
          company_id?: string
          created_at?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          updated_at?: string | null
          vault_secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          company_id: string | null
          contact_method: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          position: string | null
          status: string
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          contact_method?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          position?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          company_id?: string | null
          contact_method?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          position?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_outgoing: boolean
          message_type: string
          n8n_execution_id: string | null
          status: string | null
          timestamp: string
          workflow_name: string | null
        }
        Insert: {
          company_id: string
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_outgoing?: boolean
          message_type?: string
          n8n_execution_id?: string | null
          status?: string | null
          timestamp?: string
          workflow_name?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_outgoing?: boolean
          message_type?: string
          n8n_execution_id?: string | null
          status?: string | null
          timestamp?: string
          workflow_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          key_points: Json | null
          last_message_at: string | null
          next_actions: Json | null
          period_end: string
          period_start: string
          summary: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          key_points?: Json | null
          last_message_at?: string | null
          next_actions?: Json | null
          period_end: string
          period_start: string
          summary: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          key_points?: Json | null
          last_message_at?: string | null
          next_actions?: Json | null
          period_end?: string
          period_start?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_info: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_timestamp: string | null
          n8n_execution_id: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_info?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_timestamp?: string | null
          n8n_execution_id: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_info?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_timestamp?: string | null
          n8n_execution_id?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assignee_ids: string[] | null
          client_id: string | null
          commission_rate: number | null
          company_id: string
          created_at: string
          deal_value: number
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          owner_id: string | null
          probability: number
          property_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          assignee_ids?: string[] | null
          client_id?: string | null
          commission_rate?: number | null
          company_id: string
          created_at?: string
          deal_value: number
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number
          property_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          assignee_ids?: string[] | null
          client_id?: string | null
          commission_rate?: number | null
          company_id?: string
          created_at?: string
          deal_value?: number
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number
          property_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          notes: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_by: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_by?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_by?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          client_id: string | null
          company_id: string
          created_at: string
          deal_id: string | null
          file_path: string
          file_size: number | null
          id: string
          lead_id: string | null
          mime_type: string | null
          name: string
          property_id: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          deal_id?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          name: string
          property_id?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          deal_id?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          name?: string
          property_id?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_templates: {
        Row: {
          categories: string[] | null
          created_at: string | null
          creator_name: string | null
          creator_url: string | null
          description: string | null
          external_id: string
          how_it_works: string | null
          id: string
          is_free: boolean | null
          last_scraped_at: string | null
          last_updated_text: string | null
          nodes_used: string[] | null
          original_url: string
          preview_image_url: string | null
          price: number | null
          setup_steps: string | null
          source: string | null
          title: string
          updated_at: string | null
          workflow_json: Json | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          creator_name?: string | null
          creator_url?: string | null
          description?: string | null
          external_id: string
          how_it_works?: string | null
          id?: string
          is_free?: boolean | null
          last_scraped_at?: string | null
          last_updated_text?: string | null
          nodes_used?: string[] | null
          original_url: string
          preview_image_url?: string | null
          price?: number | null
          setup_steps?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
          workflow_json?: Json | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          creator_name?: string | null
          creator_url?: string | null
          description?: string | null
          external_id?: string
          how_it_works?: string | null
          id?: string
          is_free?: boolean | null
          last_scraped_at?: string | null
          last_updated_text?: string | null
          nodes_used?: string[] | null
          original_url?: string
          preview_image_url?: string | null
          price?: number | null
          setup_steps?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
          workflow_json?: Json | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outcome_type_embeddings: {
        Row: {
          average_similarity: number | null
          company_id: string | null
          created_at: string | null
          description: string
          embedding: string
          id: string
          language: string | null
          last_used_at: string | null
          metric_key: string
          source: string | null
          usage_count: number | null
        }
        Insert: {
          average_similarity?: number | null
          company_id?: string | null
          created_at?: string | null
          description: string
          embedding: string
          id?: string
          language?: string | null
          last_used_at?: string | null
          metric_key: string
          source?: string | null
          usage_count?: number | null
        }
        Update: {
          average_similarity?: number | null
          company_id?: string | null
          created_at?: string | null
          description?: string
          embedding?: string
          id?: string
          language?: string | null
          last_used_at?: string | null
          metric_key?: string
          source?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_type_embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          automation_frequency: string | null
          company_id: string | null
          created_at: string
          email: string
          experience_level: string | null
          first_name: string | null
          id: string
          industry: string | null
          is_active: boolean
          last_name: string | null
          notify_push: boolean | null
          onboarding_completed: boolean | null
          onesignal_player_id: string | null
          phone: string | null
          status: string | null
          stripe_customer_id: string | null
          subscription_plan: string | null
          terms_accepted_at: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_frequency?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          last_name?: string | null
          notify_push?: boolean | null
          onboarding_completed?: boolean | null
          onesignal_player_id?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          terms_accepted_at?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_frequency?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          last_name?: string | null
          notify_push?: boolean | null
          onboarding_completed?: boolean | null
          onesignal_player_id?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          terms_accepted_at?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          assignee_ids: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          company_id: string
          created_at: string
          description: string | null
          district: string | null
          facilities: Json | null
          features: Json | null
          id: string
          is_featured: boolean | null
          owner_id: string | null
          payment_date: string | null
          photos: string[] | null
          price: number | null
          property_code: string | null
          property_type: string
          revenue_type: string | null
          square_feet: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          assignee_ids?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          district?: string | null
          facilities?: Json | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          owner_id?: string | null
          payment_date?: string | null
          photos?: string[] | null
          price?: number | null
          property_code?: string | null
          property_type: string
          revenue_type?: string | null
          square_feet?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          assignee_ids?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          district?: string | null
          facilities?: Json | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          owner_id?: string | null
          payment_date?: string | null
          photos?: string[] | null
          price?: number | null
          property_code?: string | null
          property_type?: string
          revenue_type?: string | null
          square_feet?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_reviews: {
        Row: {
          created_at: string
          display_name: string
          id: string
          rating: number
          review_text: string
        }
        Insert: {
          created_at: string
          display_name: string
          id: string
          rating: number
          review_text: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          rating?: number
          review_text?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          rating: number
          review_text: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          rating: number
          review_text: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          rating?: number
          review_text?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_actions: {
        Row: {
          company_id: string | null
          conversation_id: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          success: boolean | null
          summary: string | null
          tool_args: Json
          tool_name: string
          tool_result: Json | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          conversation_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          summary?: string | null
          tool_args: Json
          tool_name: string
          tool_result?: Json | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          conversation_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          summary?: string | null
          tool_args?: Json
          tool_name?: string
          tool_result?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steve_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "steve_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_conversations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_knowledge_base: {
        Row: {
          category: string
          company_id: string | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          company_id?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_message_feedback: {
        Row: {
          comment: string | null
          conversation_id: string
          created_at: string | null
          id: string
          message_id: string
          rating: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          message_id: string
          rating: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_id?: string
          rating?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_message_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "steve_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steve_message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "steve_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_messages: {
        Row: {
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          model_used: string | null
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "steve_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_notifications: {
        Row: {
          action_url: string | null
          company_id: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      steve_usage_logs: {
        Row: {
          company_id: string | null
          completion_tokens: number | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          id: string
          model_used: string
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steve_usage_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "steve_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          message: string
          status: string | null
          user_email: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          status?: string | null
          user_email: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          status?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          automation_resolution_data: Json | null
          automation_workflow_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          created_by_automation: boolean
          creator_id: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          property_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_automation: boolean
          status: string
          subtype: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          automation_resolution_data?: Json | null
          automation_workflow_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by_automation?: boolean
          creator_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          property_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_automation?: boolean
          status?: string
          subtype?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          automation_resolution_data?: Json | null
          automation_workflow_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by_automation?: boolean
          creator_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          property_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_automation?: boolean
          status?: string
          subtype?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      viewings: {
        Row: {
          automation_workflow_id: string | null
          client_id: string | null
          company_id: string
          created_at: string | null
          created_by_automation: boolean | null
          id: string
          lead_id: string | null
          n8n_execution_id: string | null
          notes: string | null
          property_id: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          automation_workflow_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string | null
          created_by_automation?: boolean | null
          id?: string
          lead_id?: string | null
          n8n_execution_id?: string | null
          notes?: string | null
          property_id?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_workflow_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by_automation?: boolean | null
          id?: string
          lead_id?: string | null
          n8n_execution_id?: string | null
          notes?: string | null
          property_id?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          referral_source: string | null
          source: string | null
          status: string
          updated_at: string
          use_case: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          referral_source?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          referral_source?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      workflow_metric_mappings: {
        Row: {
          company_id: string
          confidence: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          detection_layer: string | null
          id: string
          inferred_metric_key: string
          matched_embedding_id: string | null
          n8n_workflow_id: string
          override_metric_key: string | null
          rules_used: Json | null
          updated_at: string | null
          vector_similarity: number | null
        }
        Insert: {
          company_id: string
          confidence?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          detection_layer?: string | null
          id?: string
          inferred_metric_key: string
          matched_embedding_id?: string | null
          n8n_workflow_id: string
          override_metric_key?: string | null
          rules_used?: Json | null
          updated_at?: string | null
          vector_similarity?: number | null
        }
        Update: {
          company_id?: string
          confidence?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          detection_layer?: string | null
          id?: string
          inferred_metric_key?: string
          matched_embedding_id?: string | null
          n8n_workflow_id?: string
          override_metric_key?: string | null
          rules_used?: Json | null
          updated_at?: string | null
          vector_similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_metric_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_metric_mappings_matched_embedding_id_fkey"
            columns: ["matched_embedding_id"]
            isOneToOne: false
            referencedRelation: "outcome_type_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          company_id: string
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          input_data: Json | null
          n8n_execution_id: string
          output_data: Json | null
          started_at: string | null
          status: string
          trigger_type: string | null
          workflow_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          n8n_execution_id: string
          output_data?: Json | null
          started_at?: string | null
          status: string
          trigger_type?: string | null
          workflow_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          n8n_execution_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          trigger_type?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_user_assignments: {
        Row: {
          assigned_by: string | null
          can_edit: boolean
          can_toggle: boolean
          can_view: boolean
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          assigned_by?: string | null
          can_edit?: boolean
          can_toggle?: boolean
          can_view?: boolean
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          assigned_by?: string | null
          can_edit?: boolean
          can_toggle?: boolean
          can_view?: boolean
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_user_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_user_assignments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          n8n_workflow_id: string
          name: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          n8n_workflow_id: string
          name: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          n8n_workflow_id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      waitlist_analytics: {
        Row: {
          first_signup: string | null
          last_30_days: number | null
          last_7_days: number | null
          most_recent_signup: string | null
          signup_count: number | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_vault_secret: {
        Args: { name: string; secret: string }
        Returns: string
      }
      delete_vault_secret: { Args: { p_id: string }; Returns: undefined }
      delete_vault_secret_by_name: {
        Args: { p_name: string }
        Returns: undefined
      }
      generate_company_name: { Args: never; Returns: string }
      generate_company_short_code: { Args: never; Returns: string }
      get_company_colleagues: {
        Args: never
        Returns: {
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_integration_api_key: {
        Args: { p_company_id: string; p_integration_type: string }
        Returns: string
      }
      get_user_company_id: { Args: never; Returns: string }
      has_exact_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      search_outcome_embeddings: {
        Args: {
          filter_company_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          average_similarity: number
          description: string
          id: string
          language: string
          metric_key: string
          similarity: number
          usage_count: number
        }[]
      }
      search_steve_knowledge: {
        Args: {
          filter_company_id?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      user_owns_or_assigned: {
        Args: { assignee_ids: string[]; owner_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "EMPLOYEE" | "FREELANCER" | "SUPER_ADMIN"
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
      app_role: ["ADMIN", "EMPLOYEE", "FREELANCER", "SUPER_ADMIN"],
    },
  },
} as const
