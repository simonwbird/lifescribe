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
      answers: {
        Row: {
          answer_text: string
          created_at: string
          family_id: string
          id: string
          profile_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          family_id: string
          id?: string
          profile_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          family_id?: string
          id?: string
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
          avatar_url: string | null
          birth_date: string | null
          birth_year: number | null
          created_at: string | null
          created_by: string | null
          death_date: string | null
          death_year: number | null
          family_id: string
          full_name: string
          gender: string | null
          given_name: string | null
          id: string
          middle_name: string | null
          notes: string | null
          surname: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_year?: number | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_year?: number | null
          family_id: string
          full_name: string
          gender?: string | null
          given_name?: string | null
          id?: string
          middle_name?: string | null
          notes?: string | null
          surname?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_year?: number | null
          created_at?: string | null
          created_by?: string | null
          death_date?: string | null
          death_year?: number | null
          family_id?: string
          full_name?: string
          gender?: string | null
          given_name?: string | null
          id?: string
          middle_name?: string | null
          notes?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          acquired_year: number | null
          address: string | null
          created_at: string | null
          created_by: string
          description: string | null
          family_id: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          sold_year: number | null
          updated_at: string | null
        }
        Insert: {
          acquired_year?: number | null
          address?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          family_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          sold_year?: number | null
          updated_at?: string | null
        }
        Update: {
          acquired_year?: number | null
          address?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          family_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          sold_year?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          family_id: string
          from_person_id: string
          id?: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          family_id?: string
          from_person_id?: string
          id?: string
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
          id: string
          profile_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          family_id: string
          id?: string
          profile_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          family_id?: string
          id?: string
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
            foreignKeyName: "stories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          maker: string | null
          object_type: string | null
          provenance: string | null
          room_hint: string | null
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
          maker?: string | null
          object_type?: string | null
          provenance?: string | null
          room_hint?: string | null
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
          maker?: string | null
          object_type?: string | null
          provenance?: string | null
          room_hint?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_family_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
    }
    Enums: {
      invite_status: "pending" | "accepted" | "expired"
      relationship_type: "parent" | "spouse"
      role_type: "admin" | "member" | "guest"
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
      invite_status: ["pending", "accepted", "expired"],
      relationship_type: ["parent", "spouse"],
      role_type: ["admin", "member", "guest"],
    },
  },
} as const
