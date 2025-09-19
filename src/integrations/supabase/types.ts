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
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          family_id: string | null
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          family_id?: string | null
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          family_id?: string | null
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          answer_text: string
          created_at: string
          family_id: string
          id: string
          is_approx: boolean | null
          occurred_on: string | null
          occurred_precision:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          family_id: string
          id?: string
          is_approx?: boolean | null
          occurred_on?: string | null
          occurred_precision?:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          family_id?: string
          id?: string
          is_approx?: boolean | null
          occurred_on?: string | null
          occurred_precision?:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          answer_id: string | null
          content: string
          created_at: string
          family_id: string
          id: string
          profile_id: string
          story_id: string | null
          updated_at: string
        }
        Insert: {
          answer_id?: string | null
          content: string
          created_at?: string
          family_id: string
          id?: string
          profile_id: string
          story_id?: string | null
          updated_at?: string
        }
        Update: {
          answer_id?: string | null
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          profile_id?: string
          story_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_audit_log: {
        Row: {
          action_type: string
          ai_suggested: boolean | null
          batch_id: string | null
          change_reason: string | null
          content_id: string
          content_type: string
          created_at: string
          editor_id: string
          family_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action_type: string
          ai_suggested?: boolean | null
          batch_id?: string | null
          change_reason?: string | null
          content_id: string
          content_type: string
          created_at?: string
          editor_id: string
          family_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action_type?: string
          ai_suggested?: boolean | null
          batch_id?: string | null
          change_reason?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          editor_id?: string
          family_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      content_batch_operations: {
        Row: {
          completed_count: number | null
          created_at: string
          error_details: Json | null
          family_id: string
          id: string
          initiated_by: string
          operation_data: Json | null
          operation_type: string
          status: string | null
          target_content_ids: string[]
          total_count: number
          updated_at: string
        }
        Insert: {
          completed_count?: number | null
          created_at?: string
          error_details?: Json | null
          family_id: string
          id?: string
          initiated_by: string
          operation_data?: Json | null
          operation_type: string
          status?: string | null
          target_content_ids: string[]
          total_count: number
          updated_at?: string
        }
        Update: {
          completed_count?: number | null
          created_at?: string
          error_details?: Json | null
          family_id?: string
          id?: string
          initiated_by?: string
          operation_data?: Json | null
          operation_type?: string
          status?: string | null
          target_content_ids?: string[]
          total_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_suggestions: {
        Row: {
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string
          created_by_ai: string | null
          family_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_data: Json | null
          status: string | null
          suggested_value: Json
          suggestion_type: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          created_by_ai?: string | null
          family_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_data?: Json | null
          status?: string | null
          suggested_value: Json
          suggestion_type: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          created_by_ai?: string | null
          family_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_data?: Json | null
          status?: string | null
          suggested_value?: Json
          suggestion_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      face_tags: {
        Row: {
          created_at: string
          created_by: string
          family_id: string
          height_percent: number
          id: string
          media_id: string
          person_id: string
          updated_at: string
          width_percent: number
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string
          created_by: string
          family_id: string
          height_percent: number
          id?: string
          media_id: string
          person_id: string
          updated_at?: string
          width_percent: number
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string
          created_by?: string
          family_id?: string
          height_percent?: number
          id?: string
          media_id?: string
          person_id?: string
          updated_at?: string
          width_percent?: number
          x_percent?: number
          y_percent?: number
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_tree_positions: {
        Row: {
          created_at: string
          family_id: string
          id: string
          person_id: string
          updated_at: string
          user_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          person_id: string
          updated_at?: string
          user_id: string
          x_position: number
          y_position: number
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          person_id?: string
          updated_at?: string
          user_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: []
      }
      gedcom_people_stage: {
        Row: {
          birth_date: string | null
          created_at: string | null
          death_date: string | null
          family_id: string
          full_name: string | null
          gender: string | null
          given_name: string | null
          id: string
          matched_person_id: string | null
          notes: string | null
          surname: string | null
          tag: string | null
          upload_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          death_date?: string | null
          family_id: string
          full_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: string
          matched_person_id?: string | null
          notes?: string | null
          surname?: string | null
          tag?: string | null
          upload_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          death_date?: string | null
          family_id?: string
          full_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: string
          matched_person_id?: string | null
          notes?: string | null
          surname?: string | null
          tag?: string | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gedcom_people_stage_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gedcom_people_stage_matched_person_id_fkey"
            columns: ["matched_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gedcom_people_stage_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "gedcom_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      gedcom_relationships_stage: {
        Row: {
          created_at: string | null
          family_id: string
          from_stage_id: string
          id: string
          rel_type: Database["public"]["Enums"]["relationship_type"]
          to_stage_id: string
          upload_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          from_stage_id: string
          id?: string
          rel_type: Database["public"]["Enums"]["relationship_type"]
          to_stage_id: string
          upload_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          from_stage_id?: string
          id?: string
          rel_type?: Database["public"]["Enums"]["relationship_type"]
          to_stage_id?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gedcom_relationships_stage_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gedcom_relationships_stage_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "gedcom_people_stage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gedcom_relationships_stage_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "gedcom_people_stage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gedcom_relationships_stage_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "gedcom_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      gedcom_uploads: {
        Row: {
          created_at: string | null
          family_id: string
          file_path: string
          id: string
          status: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          file_path: string
          id?: string
          status?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          file_path?: string
          id?: string
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "gedcom_uploads_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook: {
        Row: {
          author_profile_id: string
          body: string
          created_at: string | null
          family_id: string
          id: string
          is_anonymous: boolean | null
          is_hidden: boolean | null
          person_id: string
          visibility: string | null
        }
        Insert: {
          author_profile_id: string
          body: string
          created_at?: string | null
          family_id: string
          id?: string
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          person_id: string
          visibility?: string | null
        }
        Update: {
          author_profile_id?: string
          body?: string
          created_at?: string | null
          family_id?: string
          id?: string
          is_anonymous?: boolean | null
          is_hidden?: boolean | null
          person_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["role_type"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          family_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["role_type"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["role_type"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_events: {
        Row: {
          created_at: string
          created_by: string
          date_precision: string | null
          event_date: string | null
          event_date_text: string | null
          family_id: string
          id: string
          notes: string | null
          person_id: string | null
          recurrence: string | null
          title: string
          type: string
          updated_at: string
          with_person_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date_precision?: string | null
          event_date?: string | null
          event_date_text?: string | null
          family_id: string
          id?: string
          notes?: string | null
          person_id?: string | null
          recurrence?: string | null
          title: string
          type: string
          updated_at?: string
          with_person_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date_precision?: string | null
          event_date?: string | null
          event_date_text?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          person_id?: string | null
          recurrence?: string | null
          title?: string
          type?: string
          updated_at?: string
          with_person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_events_with_person_id_fkey"
            columns: ["with_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          answer_id: string | null
          created_at: string
          family_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          individual_story_id: string | null
          mime_type: string
          profile_id: string
          property_id: string | null
          property_media_role:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id: string | null
          story_id: string | null
          thing_id: string | null
          transcript_text: string | null
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          family_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          individual_story_id?: string | null
          mime_type: string
          profile_id: string
          property_id?: string | null
          property_media_role?:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id?: string | null
          story_id?: string | null
          thing_id?: string | null
          transcript_text?: string | null
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          family_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          individual_story_id?: string | null
          mime_type?: string
          profile_id?: string
          property_id?: string | null
          property_media_role?:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id?: string | null
          story_id?: string | null
          thing_id?: string | null
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_individual_story_id_fkey"
            columns: ["individual_story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_property_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_recipe_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_thing_fkey"
            columns: ["thing_id"]
            isOneToOne: false
            referencedRelation: "things"
            referencedColumns: ["id"]
          },
        ]
      }
      media_pipeline_jobs: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          error_details: Json | null
          error_message: string | null
          family_id: string
          id: string
          media_id: string
          processing_time_ms: number | null
          raw_output: Json | null
          retry_count: number | null
          stage: Database["public"]["Enums"]["media_pipeline_stage"]
          started_at: string | null
          status: Database["public"]["Enums"]["media_job_status"]
          updated_at: string
          vendor_used: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          family_id: string
          id?: string
          media_id: string
          processing_time_ms?: number | null
          raw_output?: Json | null
          retry_count?: number | null
          stage: Database["public"]["Enums"]["media_pipeline_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["media_job_status"]
          updated_at?: string
          vendor_used?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          family_id?: string
          id?: string
          media_id?: string
          processing_time_ms?: number | null
          raw_output?: Json | null
          retry_count?: number | null
          stage?: Database["public"]["Enums"]["media_pipeline_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["media_job_status"]
          updated_at?: string
          vendor_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_pipeline_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      media_pipeline_metrics: {
        Row: {
          avg_processing_time_ms: number | null
          created_at: string
          date: string
          failed_jobs: number | null
          id: string
          p95_processing_time_ms: number | null
          stage: Database["public"]["Enums"]["media_pipeline_stage"]
          successful_jobs: number | null
          total_cost_usd: number | null
          total_jobs: number | null
          vendor: string | null
        }
        Insert: {
          avg_processing_time_ms?: number | null
          created_at?: string
          date?: string
          failed_jobs?: number | null
          id?: string
          p95_processing_time_ms?: number | null
          stage: Database["public"]["Enums"]["media_pipeline_stage"]
          successful_jobs?: number | null
          total_cost_usd?: number | null
          total_jobs?: number | null
          vendor?: string | null
        }
        Update: {
          avg_processing_time_ms?: number | null
          created_at?: string
          date?: string
          failed_jobs?: number | null
          id?: string
          p95_processing_time_ms?: number | null
          stage?: Database["public"]["Enums"]["media_pipeline_stage"]
          successful_jobs?: number | null
          total_cost_usd?: number | null
          total_jobs?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      media_vendor_status: {
        Row: {
          avg_response_time_ms: number | null
          cost_per_unit: number | null
          created_at: string
          error_rate_24h: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          unit_type: string | null
          updated_at: string
          vendor_name: string
          vendor_type: Database["public"]["Enums"]["media_vendor_type"]
        }
        Insert: {
          avg_response_time_ms?: number | null
          cost_per_unit?: number | null
          created_at?: string
          error_rate_24h?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          unit_type?: string | null
          updated_at?: string
          vendor_name: string
          vendor_type: Database["public"]["Enums"]["media_vendor_type"]
        }
        Update: {
          avg_response_time_ms?: number | null
          cost_per_unit?: number | null
          created_at?: string
          error_rate_24h?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          unit_type?: string | null
          updated_at?: string
          vendor_name?: string
          vendor_type?: Database["public"]["Enums"]["media_vendor_type"]
        }
        Relationships: []
      }
      members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["role_type"]
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["role_type"]
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["role_type"]
        }
        Relationships: [
          {
            foreignKeyName: "members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["moderation_action_type"]
          actor_id: string
          created_at: string
          flag_id: string
          id: string
          metadata: Json | null
          rationale: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["moderation_action_type"]
          actor_id: string
          created_at?: string
          flag_id: string
          id?: string
          metadata?: Json | null
          rationale: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["moderation_action_type"]
          actor_id?: string
          created_at?: string
          flag_id?: string
          id?: string
          metadata?: Json | null
          rationale?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          created_at: string
          details: Json | null
          family_id: string
          flagged_by: string | null
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          reason: string
          severity: number | null
          source: Database["public"]["Enums"]["moderation_source"]
        }
        Insert: {
          created_at?: string
          details?: Json | null
          family_id: string
          flagged_by?: string | null
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          reason: string
          severity?: number | null
          source: Database["public"]["Enums"]["moderation_source"]
        }
        Update: {
          created_at?: string
          details?: Json | null
          family_id?: string
          flagged_by?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["moderation_item_type"]
          reason?: string
          severity?: number | null
          source?: Database["public"]["Enums"]["moderation_source"]
        }
        Relationships: []
      }
      moderation_queue_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          family_id: string
          flag_id: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          priority: number | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          family_id: string
          flag_id: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          priority?: number | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          family_id?: string
          flag_id?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["moderation_item_type"]
          priority?: number | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_items_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          family_id: string
          id: string
          is_read: boolean
          media_id: string | null
          message: string
          recipient_id: string
          sender_id: string
          story_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          is_read?: boolean
          media_id?: string | null
          message: string
          recipient_id: string
          sender_id: string
          story_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          is_read?: boolean
          media_id?: string | null
          message?: string
          recipient_id?: string
          sender_id?: string
          story_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_conversions: {
        Row: {
          conversion_data: Json | null
          conversion_event: string
          converted_at: string
          family_id: string | null
          hours_to_convert: number | null
          id: string
          nudge_send_id: string
          user_id: string
        }
        Insert: {
          conversion_data?: Json | null
          conversion_event: string
          converted_at?: string
          family_id?: string | null
          hours_to_convert?: number | null
          id?: string
          nudge_send_id: string
          user_id: string
        }
        Update: {
          conversion_data?: Json | null
          conversion_event?: string
          converted_at?: string
          family_id?: string | null
          hours_to_convert?: number | null
          id?: string
          nudge_send_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_conversions_nudge_send_id_fkey"
            columns: ["nudge_send_id"]
            isOneToOne: false
            referencedRelation: "nudge_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_sends: {
        Row: {
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          clicked_at: string | null
          delivered_at: string | null
          family_id: string | null
          id: string
          nudge_id: string
          opened_at: string | null
          send_metadata: Json | null
          sent_at: string
          template_id: string | null
          trigger_data: Json | null
          user_id: string
          variant: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          clicked_at?: string | null
          delivered_at?: string | null
          family_id?: string | null
          id?: string
          nudge_id: string
          opened_at?: string | null
          send_metadata?: Json | null
          sent_at?: string
          template_id?: string | null
          trigger_data?: Json | null
          user_id: string
          variant?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["nudge_channel_type"]
          clicked_at?: string | null
          delivered_at?: string | null
          family_id?: string | null
          id?: string
          nudge_id?: string
          opened_at?: string | null
          send_metadata?: Json | null
          sent_at?: string
          template_id?: string | null
          trigger_data?: Json | null
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nudge_sends_nudge_id_fkey"
            columns: ["nudge_id"]
            isOneToOne: false
            referencedRelation: "nudges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "nudge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_templates: {
        Row: {
          category: string | null
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          content: string
          created_at: string
          id: string
          name: string
          subject: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          content: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          channel?: Database["public"]["Enums"]["nudge_channel_type"]
          content?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      nudges: {
        Row: {
          audience_rules: Json | null
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          conversion_events: string[] | null
          conversion_window_hours: number | null
          created_at: string
          created_by: string
          description: string | null
          ended_at: string | null
          family_id: string | null
          holdout_percentage: number | null
          id: string
          is_ab_test: boolean | null
          name: string
          started_at: string | null
          status: Database["public"]["Enums"]["nudge_status"]
          template_id: string | null
          throttle_config: Json | null
          trigger_config: Json | null
          trigger_type: Database["public"]["Enums"]["nudge_trigger_type"]
          updated_at: string
          variant_a_percentage: number | null
          variant_b_template_id: string | null
        }
        Insert: {
          audience_rules?: Json | null
          channel: Database["public"]["Enums"]["nudge_channel_type"]
          conversion_events?: string[] | null
          conversion_window_hours?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          ended_at?: string | null
          family_id?: string | null
          holdout_percentage?: number | null
          id?: string
          is_ab_test?: boolean | null
          name: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["nudge_status"]
          template_id?: string | null
          throttle_config?: Json | null
          trigger_config?: Json | null
          trigger_type: Database["public"]["Enums"]["nudge_trigger_type"]
          updated_at?: string
          variant_a_percentage?: number | null
          variant_b_template_id?: string | null
        }
        Update: {
          audience_rules?: Json | null
          channel?: Database["public"]["Enums"]["nudge_channel_type"]
          conversion_events?: string[] | null
          conversion_window_hours?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          ended_at?: string | null
          family_id?: string | null
          holdout_percentage?: number | null
          id?: string
          is_ab_test?: boolean | null
          name?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["nudge_status"]
          template_id?: string | null
          throttle_config?: Json | null
          trigger_config?: Json | null
          trigger_type?: Database["public"]["Enums"]["nudge_trigger_type"]
          updated_at?: string
          variant_a_percentage?: number | null
          variant_b_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nudges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "nudge_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudges_variant_b_template_id_fkey"
            columns: ["variant_b_template_id"]
            isOneToOne: false
            referencedRelation: "nudge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          alt_names: string[] | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          birth_date_precision: string | null
          birth_year: number | null
          claimed_by_profile_id: string | null
          created_at: string | null
          created_by: string | null
          death_date: string | null
          death_date_precision: string | null
          death_year: number | null
          family_id: string
          favorites: Json | null
          full_name: string
          gender: string | null
          given_name: string | null
          id: string
          is_living: boolean | null
          middle_name: string | null
          notes: string | null
          person_type: string
          pinned_story_ids: string[] | null
          surname: string | null
          updated_at: string | null
        }
        Insert: {
          alt_names?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_precision?: string | null
          birth_year?: number | null
          claimed_by_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_date_precision?: string | null
          death_year?: number | null
          family_id: string
          favorites?: Json | null
          full_name: string
          gender?: string | null
          given_name?: string | null
          id?: string
          is_living?: boolean | null
          middle_name?: string | null
          notes?: string | null
          person_type?: string
          pinned_story_ids?: string[] | null
          surname?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_names?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_precision?: string | null
          birth_year?: number | null
          claimed_by_profile_id?: string | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_date_precision?: string | null
          death_year?: number | null
          family_id?: string
          favorites?: Json | null
          full_name?: string
          gender?: string | null
          given_name?: string | null
          id?: string
          is_living?: boolean | null
          middle_name?: string | null
          notes?: string | null
          person_type?: string
          pinned_story_ids?: string[] | null
          surname?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      person_answer_links: {
        Row: {
          answer_id: string
          created_at: string | null
          family_id: string
          id: string
          person_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_answer_links_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_answer_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_answer_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_story_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          person_id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_story_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_story_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_story_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      person_user_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          person_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_user_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_user_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_person_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          person_id: string
          pet_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
          pet_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
          pet_id?: string
          relationship?: string | null
        }
        Relationships: []
      }
      pet_reminders: {
        Row: {
          created_at: string | null
          due_date: string
          family_id: string
          id: string
          notes: string | null
          pet_id: string
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          family_id: string
          id?: string
          notes?: string | null
          pet_id: string
          status?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          family_id?: string
          id?: string
          notes?: string | null
          pet_id?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      pet_vaccines: {
        Row: {
          created_at: string | null
          date_given: string | null
          due_date: string | null
          family_id: string
          id: string
          name: string
          notes: string | null
          pet_id: string
        }
        Insert: {
          created_at?: string | null
          date_given?: string | null
          due_date?: string | null
          family_id: string
          id?: string
          name: string
          notes?: string | null
          pet_id: string
        }
        Update: {
          created_at?: string | null
          date_given?: string | null
          due_date?: string | null
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
        }
        Relationships: []
      }
      pet_visits: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          notes: string | null
          pet_id: string
          reason: string | null
          visit_date: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          notes?: string | null
          pet_id: string
          reason?: string | null
          visit_date: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          pet_id?: string
          reason?: string | null
          visit_date?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          allergies: string | null
          awards: string[] | null
          bedtime_routine: string | null
          breed: string | null
          breeder_rescue: string | null
          care_instructions: string | null
          color: string | null
          conditions: string[] | null
          cover_url: string | null
          created_at: string
          created_by: string
          diet: string | null
          dna_test_provider: string | null
          dna_test_url: string | null
          dob_approx: string | null
          family_id: string
          favorites: string[] | null
          feeding_routine: string | null
          gotcha_date: string | null
          home_property_id: string | null
          id: string
          insurance_policy: string | null
          insurance_provider: string | null
          insurance_renews: string | null
          license_authority: string | null
          license_expires: string | null
          license_number: string | null
          markings: string | null
          medications: string | null
          microchip_date: string | null
          microchip_number: string | null
          microchip_provider: string | null
          name: string
          neutered: boolean | null
          passed_at: string | null
          property_id: string | null
          registry_id: string | null
          registry_org: string | null
          roles: string[] | null
          room: string | null
          sex: string | null
          species: string
          status: string
          tags: string[] | null
          temperament: string | null
          updated_at: string
          vet_email: string | null
          vet_name: string | null
          vet_phone: string | null
          walks_routine: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          awards?: string[] | null
          bedtime_routine?: string | null
          breed?: string | null
          breeder_rescue?: string | null
          care_instructions?: string | null
          color?: string | null
          conditions?: string[] | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          diet?: string | null
          dna_test_provider?: string | null
          dna_test_url?: string | null
          dob_approx?: string | null
          family_id: string
          favorites?: string[] | null
          feeding_routine?: string | null
          gotcha_date?: string | null
          home_property_id?: string | null
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          insurance_renews?: string | null
          license_authority?: string | null
          license_expires?: string | null
          license_number?: string | null
          markings?: string | null
          medications?: string | null
          microchip_date?: string | null
          microchip_number?: string | null
          microchip_provider?: string | null
          name: string
          neutered?: boolean | null
          passed_at?: string | null
          property_id?: string | null
          registry_id?: string | null
          registry_org?: string | null
          roles?: string[] | null
          room?: string | null
          sex?: string | null
          species: string
          status?: string
          tags?: string[] | null
          temperament?: string | null
          updated_at?: string
          vet_email?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          walks_routine?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          awards?: string[] | null
          bedtime_routine?: string | null
          breed?: string | null
          breeder_rescue?: string | null
          care_instructions?: string | null
          color?: string | null
          conditions?: string[] | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          diet?: string | null
          dna_test_provider?: string | null
          dna_test_url?: string | null
          dob_approx?: string | null
          family_id?: string
          favorites?: string[] | null
          feeding_routine?: string | null
          gotcha_date?: string | null
          home_property_id?: string | null
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          insurance_renews?: string | null
          license_authority?: string | null
          license_expires?: string | null
          license_number?: string | null
          markings?: string | null
          medications?: string | null
          microchip_date?: string | null
          microchip_number?: string | null
          microchip_provider?: string | null
          name?: string
          neutered?: boolean | null
          passed_at?: string | null
          property_id?: string | null
          registry_id?: string | null
          registry_org?: string | null
          roles?: string[] | null
          room?: string | null
          sex?: string | null
          species?: string
          status?: string
          tags?: string[] | null
          temperament?: string | null
          updated_at?: string
          vet_email?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          walks_routine?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_home_property_id_fkey"
            columns: ["home_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_space_id: string | null
          email: string
          feature_flags: Json | null
          full_name: string | null
          id: string
          settings: Json | null
          simple_mode: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_space_id?: string | null
          email: string
          feature_flags?: Json | null
          full_name?: string | null
          id: string
          settings?: Json | null
          simple_mode?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_space_id?: string | null
          email?: string
          feature_flags?: Json | null
          full_name?: string | null
          id?: string
          settings?: Json | null
          simple_mode?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_space_id_fkey"
            columns: ["default_space_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          acquired_year: number | null
          address: string | null
          address_json: Json | null
          address_visibility:
            | Database["public"]["Enums"]["address_visibility"]
            | null
          built_year: number | null
          built_year_circa: boolean | null
          cover_media_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          display_title: string | null
          family_id: string
          first_known_circa: boolean | null
          first_known_date: string | null
          geocode: Json | null
          id: string
          last_known_circa: boolean | null
          last_known_date: string | null
          latitude: number | null
          longitude: number | null
          map_visibility: boolean | null
          name: string
          property_types: Database["public"]["Enums"]["property_type"][] | null
          sold_year: number | null
          status: Database["public"]["Enums"]["property_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          acquired_year?: number | null
          address?: string | null
          address_json?: Json | null
          address_visibility?:
            | Database["public"]["Enums"]["address_visibility"]
            | null
          built_year?: number | null
          built_year_circa?: boolean | null
          cover_media_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          display_title?: string | null
          family_id: string
          first_known_circa?: boolean | null
          first_known_date?: string | null
          geocode?: Json | null
          id?: string
          last_known_circa?: boolean | null
          last_known_date?: string | null
          latitude?: number | null
          longitude?: number | null
          map_visibility?: boolean | null
          name: string
          property_types?: Database["public"]["Enums"]["property_type"][] | null
          sold_year?: number | null
          status?: Database["public"]["Enums"]["property_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          acquired_year?: number | null
          address?: string | null
          address_json?: Json | null
          address_visibility?:
            | Database["public"]["Enums"]["address_visibility"]
            | null
          built_year?: number | null
          built_year_circa?: boolean | null
          cover_media_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_title?: string | null
          family_id?: string
          first_known_circa?: boolean | null
          first_known_date?: string | null
          geocode?: Json | null
          id?: string
          last_known_circa?: boolean | null
          last_known_date?: string | null
          latitude?: number | null
          longitude?: number | null
          map_visibility?: boolean | null
          name?: string
          property_types?: Database["public"]["Enums"]["property_type"][] | null
          sold_year?: number | null
          status?: Database["public"]["Enums"]["property_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_events: {
        Row: {
          created_at: string
          created_by: string
          event_date: string | null
          event_date_circa: boolean | null
          event_type: Database["public"]["Enums"]["property_event_type"]
          family_id: string
          id: string
          media_ids: string[] | null
          notes: string | null
          people_ids: string[] | null
          property_id: string
          story_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_date?: string | null
          event_date_circa?: boolean | null
          event_type: Database["public"]["Enums"]["property_event_type"]
          family_id: string
          id?: string
          media_ids?: string[] | null
          notes?: string | null
          people_ids?: string[] | null
          property_id: string
          story_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_date?: string | null
          event_date_circa?: boolean | null
          event_type?: Database["public"]["Enums"]["property_event_type"]
          family_id?: string
          id?: string
          media_ids?: string[] | null
          notes?: string | null
          people_ids?: string[] | null
          property_id?: string
          story_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_occupancy: {
        Row: {
          created_at: string
          end_date: string | null
          end_date_circa: boolean | null
          family_id: string
          id: string
          notes: string | null
          person_id: string
          primary_home: boolean | null
          property_id: string
          role: Database["public"]["Enums"]["occupancy_role"]
          start_date: string | null
          start_date_circa: boolean | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          end_date_circa?: boolean | null
          family_id: string
          id?: string
          notes?: string | null
          person_id: string
          primary_home?: boolean | null
          property_id: string
          role?: Database["public"]["Enums"]["occupancy_role"]
          start_date?: string | null
          start_date_circa?: boolean | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          end_date_circa?: boolean | null
          family_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          primary_home?: boolean | null
          property_id?: string
          role?: Database["public"]["Enums"]["occupancy_role"]
          start_date?: string | null
          start_date_circa?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "property_occupancy_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_occupancy_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_rooms: {
        Row: {
          created_at: string
          created_by: string
          family_id: string
          id: string
          name: string
          notes: string | null
          property_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          name: string
          notes?: string | null
          property_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_story_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          property_id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          property_id: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          property_id?: string
          story_id?: string
        }
        Relationships: []
      }
      property_visits: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          family_id: string
          id: string
          notes: string | null
          occasion: Database["public"]["Enums"]["visit_occasion"] | null
          people_ids: string[] | null
          property_id: string
          recurring_pattern: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          family_id: string
          id?: string
          notes?: string | null
          occasion?: Database["public"]["Enums"]["visit_occasion"] | null
          people_ids?: string[] | null
          property_id: string
          recurring_pattern?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          occasion?: Database["public"]["Enums"]["visit_occasion"] | null
          people_ids?: string[] | null
          property_id?: string
          recurring_pattern?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          question_text: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          question_text: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question_text?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          answer_id: string | null
          comment_id: string | null
          created_at: string
          family_id: string
          id: string
          profile_id: string
          reaction_type: string
          story_id: string | null
        }
        Insert: {
          answer_id?: string | null
          comment_id?: string | null
          created_at?: string
          family_id: string
          id?: string
          profile_id: string
          reaction_type: string
          story_id?: string | null
        }
        Update: {
          answer_id?: string | null
          comment_id?: string | null
          created_at?: string
          family_id?: string
          id?: string
          profile_id?: string
          reaction_type?: string
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_person_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          person_id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
          recipe_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
          recipe_id?: string
        }
        Relationships: []
      }
      recipe_story_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          recipe_id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          recipe_id: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          recipe_id?: string
          story_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string | null
          created_by: string
          dietary_tags: string[] | null
          family_id: string
          id: string
          ingredients: Json | null
          notes: string | null
          serves: string | null
          source: string | null
          steps: Json | null
          time_cook_minutes: number | null
          time_prep_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          dietary_tags?: string[] | null
          family_id: string
          id?: string
          ingredients?: Json | null
          notes?: string | null
          serves?: string | null
          source?: string | null
          steps?: Json | null
          time_cook_minutes?: number | null
          time_prep_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          dietary_tags?: string[] | null
          family_id?: string
          id?: string
          ingredients?: Json | null
          notes?: string | null
          serves?: string | null
          source?: string | null
          steps?: Json | null
          time_cook_minutes?: number | null
          time_prep_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string | null
          created_by: string | null
          family_id: string
          from_person_id: string
          id: string
          is_biological: boolean | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          family_id: string
          from_person_id: string
          id?: string
          is_biological?: boolean | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          family_id?: string
          from_person_id?: string
          id?: string
          is_biological?: boolean | null
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          to_person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_from_person_id_fkey"
            columns: ["from_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_person_id_fkey"
            columns: ["to_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          family_id: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          family_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          family_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          content: string
          created_at: string
          family_id: string
          happened_at_property_id: string | null
          id: string
          is_approx: boolean | null
          occurred_on: string | null
          occurred_precision:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id: string
          prompt_id: string | null
          prompt_text: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          family_id: string
          happened_at_property_id?: string | null
          id?: string
          is_approx?: boolean | null
          occurred_on?: string | null
          occurred_precision?:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id: string
          prompt_id?: string | null
          prompt_text?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          family_id?: string
          happened_at_property_id?: string | null
          id?: string
          is_approx?: boolean | null
          occurred_on?: string | null
          occurred_precision?:
            | Database["public"]["Enums"]["date_precision"]
            | null
          profile_id?: string
          prompt_id?: string | null
          prompt_text?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_happened_at_property_id_fkey"
            columns: ["happened_at_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          created_at: string
          family_id: string
          id: string
          payload: Json
          person_id: string | null
          resolved_at: string | null
          status: string
          suggested_by: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          payload?: Json
          person_id?: string | null
          resolved_at?: string | null
          status?: string
          suggested_by: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          payload?: Json
          person_id?: string | null
          resolved_at?: string | null
          status?: string
          suggested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      thing_person_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          person_id: string
          thing_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          person_id: string
          thing_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          person_id?: string
          thing_id?: string
        }
        Relationships: []
      }
      thing_story_links: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          story_id: string
          thing_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          story_id: string
          thing_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          story_id?: string
          thing_id?: string
        }
        Relationships: []
      }
      things: {
        Row: {
          condition: string | null
          created_at: string | null
          created_by: string
          current_property_id: string | null
          description: string | null
          family_id: string
          id: string
          lives_at_property_id: string | null
          maker: string | null
          object_type: string | null
          provenance: string | null
          room_hint: string | null
          room_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          value_estimate: string | null
          year_estimated: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          created_by: string
          current_property_id?: string | null
          description?: string | null
          family_id: string
          id?: string
          lives_at_property_id?: string | null
          maker?: string | null
          object_type?: string | null
          provenance?: string | null
          room_hint?: string | null
          room_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value_estimate?: string | null
          year_estimated?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          created_by?: string
          current_property_id?: string | null
          description?: string | null
          family_id?: string
          id?: string
          lives_at_property_id?: string | null
          maker?: string | null
          object_type?: string | null
          provenance?: string | null
          room_hint?: string | null
          room_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value_estimate?: string | null
          year_estimated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "things_current_property_fkey"
            columns: ["current_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "things_lives_at_property_id_fkey"
            columns: ["lives_at_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "things_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "property_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_families: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          family_id: string
          id: string
          partner1_id: string | null
          partner2_id: string | null
          relationship_type: string | null
          source_xref: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          family_id: string
          id?: string
          partner1_id?: string | null
          partner2_id?: string | null
          relationship_type?: string | null
          source_xref?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          family_id?: string
          id?: string
          partner1_id?: string | null
          partner2_id?: string | null
          relationship_type?: string | null
          source_xref?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_families_partner1_fkey"
            columns: ["partner1_id"]
            isOneToOne: false
            referencedRelation: "tree_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_families_partner2_fkey"
            columns: ["partner2_id"]
            isOneToOne: false
            referencedRelation: "tree_people"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_family_children: {
        Row: {
          child_id: string
          created_at: string | null
          family_id: string
          relationship_note: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          family_id: string
          relationship_note?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          family_id?: string
          relationship_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_family_children_child_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "tree_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_family_children_family_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "tree_families"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          errors_log: Json | null
          families_count: number | null
          family_id: string
          file_name: string | null
          file_path: string | null
          id: string
          import_type: string
          imported_by: string
          people_count: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          errors_log?: Json | null
          families_count?: number | null
          family_id: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          import_type: string
          imported_by: string
          people_count?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          errors_log?: Json | null
          families_count?: number | null
          family_id?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          import_type?: string
          imported_by?: string
          people_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_imports_family_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_people: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          created_by: string | null
          death_date: string | null
          death_place: string | null
          family_id: string
          given_name: string | null
          id: string
          is_living: boolean | null
          notes: string | null
          profile_photo_url: string | null
          sex: string | null
          source_xref: string | null
          surname: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_place?: string | null
          family_id: string
          given_name?: string | null
          id?: string
          is_living?: boolean | null
          notes?: string | null
          profile_photo_url?: string | null
          sex?: string | null
          source_xref?: string | null
          surname?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_place?: string | null
          family_id?: string
          given_name?: string | null
          id?: string
          is_living?: boolean | null
          notes?: string | null
          profile_photo_url?: string | null
          sex?: string | null
          source_xref?: string | null
          surname?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_people_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_person_aliases: {
        Row: {
          alias: string
          alias_type: string | null
          created_at: string | null
          id: string
          person_id: string
        }
        Insert: {
          alias: string
          alias_type?: string | null
          created_at?: string | null
          id?: string
          person_id: string
        }
        Update: {
          alias?: string
          alias_type?: string | null
          created_at?: string | null
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_person_aliases_person_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "tree_people"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_preferences: {
        Row: {
          family_id: string
          root_person_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          family_id: string
          root_person_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          family_id?: string
          root_person_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_preferences_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_preferences_root_person_id_fkey"
            columns: ["root_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_digest_logs: {
        Row: {
          created_at: string
          digest_settings_id: string
          error_message: string | null
          family_id: string
          id: string
          sent_at: string
          sent_to_emails: Json
          status: string
          story_count: number
        }
        Insert: {
          created_at?: string
          digest_settings_id: string
          error_message?: string | null
          family_id: string
          id?: string
          sent_at?: string
          sent_to_emails?: Json
          status?: string
          story_count?: number
        }
        Update: {
          created_at?: string
          digest_settings_id?: string
          error_message?: string | null
          family_id?: string
          id?: string
          sent_at?: string
          sent_to_emails?: Json
          status?: string
          story_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_digest_logs_digest_settings_id_fkey"
            columns: ["digest_settings_id"]
            isOneToOne: false
            referencedRelation: "weekly_digest_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_digest_settings: {
        Row: {
          created_at: string
          created_by: string
          delivery_day: number
          delivery_hour: number
          delivery_timezone: string
          enabled: boolean
          family_id: string
          id: string
          last_sent_at: string | null
          recipients: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_day?: number
          delivery_hour?: number
          delivery_timezone?: string
          enabled?: boolean
          family_id: string
          id?: string
          last_sent_at?: string | null
          recipients?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_day?: number
          delivery_hour?: number
          delivery_timezone?: string
          enabled?: boolean
          family_id?: string
          id?: string
          last_sent_at?: string | null
          recipients?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      invites_masked: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          family_id: string | null
          id: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["role_type"] | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: never
          expires_at?: string | null
          family_id?: string | null
          id?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: never
          expires_at?: string | null
          family_id?: string | null
          id?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      person_timeline_items: {
        Row: {
          excerpt: string | null
          family_id: string | null
          happened_on: string | null
          is_approx: boolean | null
          item_id: string | null
          item_type: string | null
          occurred_precision:
            | Database["public"]["Enums"]["date_precision"]
            | null
          person_id: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_family_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      is_family_admin: {
        Args: { family_id: string; user_id: string }
        Returns: boolean
      }
      log_content_change: {
        Args: {
          p_action_type: string
          p_ai_suggested?: boolean
          p_batch_id?: string
          p_change_reason?: string
          p_content_id: string
          p_content_type: string
          p_editor_id: string
          p_family_id: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_family_id: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      address_visibility: "exact" | "street_hidden" | "city_only"
      date_precision: "day" | "month" | "year"
      invite_status: "pending" | "accepted" | "expired"
      media_job_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "retrying"
      media_pipeline_stage: "upload" | "virus_scan" | "ocr" | "asr" | "index"
      media_vendor_type: "transcription" | "ocr" | "virus_scan" | "storage"
      moderation_action_type:
        | "hide"
        | "blur"
        | "age_gate"
        | "notify_owner"
        | "escalate"
        | "resolve"
      moderation_item_type: "story" | "media" | "answer" | "comment"
      moderation_source:
        | "user_flag"
        | "automated_nsfw"
        | "automated_toxicity"
        | "automated_pii"
        | "dmca"
      moderation_status: "pending" | "in_review" | "resolved" | "escalated"
      nudge_channel_type: "email" | "sms" | "in_app" | "push"
      nudge_status: "draft" | "active" | "paused" | "completed"
      nudge_trigger_type:
        | "no_memory_24h"
        | "no_memory_7d"
        | "no_invite_sent"
        | "no_digest_enabled"
        | "inactive_7d"
        | "inactive_30d"
        | "first_login"
        | "memory_milestone"
      occupancy_role:
        | "owner"
        | "tenant"
        | "child"
        | "guest"
        | "host"
        | "relative"
        | "roommate"
      property_event_type:
        | "moved_in"
        | "moved_out"
        | "purchase"
        | "sale"
        | "renovation"
        | "extension"
        | "garden_change"
        | "birth"
        | "party"
        | "storm"
        | "flood"
        | "fire"
        | "holiday"
        | "photo_taken"
        | "other"
      property_media_role:
        | "cover"
        | "then"
        | "now"
        | "floorplan"
        | "deed"
        | "mortgage"
        | "survey"
        | "letter"
        | "bill"
        | "receipt"
        | "newspaper_clipping"
        | "general"
      property_status: "current" | "sold" | "rented" | "demolished" | "unknown"
      property_type:
        | "house"
        | "apartment"
        | "townhouse"
        | "cottage"
        | "villa"
        | "holiday_home"
        | "farm"
        | "ranch"
        | "student_housing"
        | "military_housing"
        | "multi_unit"
        | "caravan"
        | "motorhome"
        | "houseboat"
        | "boat"
        | "bungalow"
        | "duplex"
        | "terrace"
        | "loft"
        | "studio"
        | "retirement_home"
        | "boarding_house"
        | "ancestral_home"
        | "business_premises"
        | "land"
        | "other"
      relationship_type: "parent" | "spouse" | "divorced" | "unmarried"
      role_type: "admin" | "member" | "guest"
      visit_occasion: "holiday" | "celebration" | "reunion" | "other"
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
      address_visibility: ["exact", "street_hidden", "city_only"],
      date_precision: ["day", "month", "year"],
      invite_status: ["pending", "accepted", "expired"],
      media_job_status: [
        "pending",
        "in_progress",
        "completed",
        "failed",
        "retrying",
      ],
      media_pipeline_stage: ["upload", "virus_scan", "ocr", "asr", "index"],
      media_vendor_type: ["transcription", "ocr", "virus_scan", "storage"],
      moderation_action_type: [
        "hide",
        "blur",
        "age_gate",
        "notify_owner",
        "escalate",
        "resolve",
      ],
      moderation_item_type: ["story", "media", "answer", "comment"],
      moderation_source: [
        "user_flag",
        "automated_nsfw",
        "automated_toxicity",
        "automated_pii",
        "dmca",
      ],
      moderation_status: ["pending", "in_review", "resolved", "escalated"],
      nudge_channel_type: ["email", "sms", "in_app", "push"],
      nudge_status: ["draft", "active", "paused", "completed"],
      nudge_trigger_type: [
        "no_memory_24h",
        "no_memory_7d",
        "no_invite_sent",
        "no_digest_enabled",
        "inactive_7d",
        "inactive_30d",
        "first_login",
        "memory_milestone",
      ],
      occupancy_role: [
        "owner",
        "tenant",
        "child",
        "guest",
        "host",
        "relative",
        "roommate",
      ],
      property_event_type: [
        "moved_in",
        "moved_out",
        "purchase",
        "sale",
        "renovation",
        "extension",
        "garden_change",
        "birth",
        "party",
        "storm",
        "flood",
        "fire",
        "holiday",
        "photo_taken",
        "other",
      ],
      property_media_role: [
        "cover",
        "then",
        "now",
        "floorplan",
        "deed",
        "mortgage",
        "survey",
        "letter",
        "bill",
        "receipt",
        "newspaper_clipping",
        "general",
      ],
      property_status: ["current", "sold", "rented", "demolished", "unknown"],
      property_type: [
        "house",
        "apartment",
        "townhouse",
        "cottage",
        "villa",
        "holiday_home",
        "farm",
        "ranch",
        "student_housing",
        "military_housing",
        "multi_unit",
        "caravan",
        "motorhome",
        "houseboat",
        "boat",
        "bungalow",
        "duplex",
        "terrace",
        "loft",
        "studio",
        "retirement_home",
        "boarding_house",
        "ancestral_home",
        "business_premises",
        "land",
        "other",
      ],
      relationship_type: ["parent", "spouse", "divorced", "unmarried"],
      role_type: ["admin", "member", "guest"],
      visit_occasion: ["holiday", "celebration", "reunion", "other"],
    },
  },
} as const
