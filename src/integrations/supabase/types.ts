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
          mime_type: string
          profile_id: string
          property_id: string | null
          property_media_role:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id: string | null
          story_id: string | null
          thing_id: string | null
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          family_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          profile_id: string
          property_id?: string | null
          property_media_role?:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id?: string | null
          story_id?: string | null
          thing_id?: string | null
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          family_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          profile_id?: string
          property_id?: string | null
          property_media_role?:
            | Database["public"]["Enums"]["property_media_role"]
            | null
          recipe_id?: string | null
          story_id?: string | null
          thing_id?: string | null
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
    }
    Enums: {
      address_visibility: "exact" | "street_hidden" | "city_only"
      date_precision: "day" | "month" | "year"
      invite_status: "pending" | "accepted" | "expired"
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
