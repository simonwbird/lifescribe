export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          family_id: string
          profile_id: string
          role: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          profile_id: string
          role?: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          joined_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          profile_id?: string
          role?: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          joined_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          family_id: string
          email: string
          role: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          token: string
          invited_by: string
          expires_at: string
          accepted_at: string | null
          created_at: string
          status?: string
          sent_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoke_reason?: string | null
          invite_method?: string
          metadata?: any
        }
        Insert: {
          id?: string
          family_id: string
          email: string
          role?: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          token: string
          invited_by: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
          status?: string
          sent_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoke_reason?: string | null
          invite_method?: string
          metadata?: any
        }
        Update: {
          id?: string
          family_id?: string
          email?: string
          role?: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
          token?: string
          invited_by?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          status?: string
          sent_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoke_reason?: string | null
          invite_method?: string
          metadata?: any
        }
      }
      questions: {
        Row: {
          id: string
          category: string
          question_text: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          question_text: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          question_text?: string
          is_active?: boolean
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          profile_id: string
          family_id: string
          answer_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          profile_id: string
          family_id: string
          answer_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          profile_id?: string
          family_id?: string
          answer_text?: string
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          family_id: string
          profile_id: string
          title: string
          content: string
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          profile_id: string
          title: string
          content: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          profile_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          story_id: string | null
          answer_id: string | null
          profile_id: string
          family_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          profile_id: string
          family_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          profile_id?: string
          family_id?: string
          file_path?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          story_id: string | null
          answer_id: string | null
          profile_id: string
          family_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          profile_id: string
          family_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          profile_id?: string
          family_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          story_id: string | null
          answer_id: string | null
          comment_id: string | null
          profile_id: string
          family_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          comment_id?: string | null
          profile_id: string
          family_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          answer_id?: string | null
          comment_id?: string | null
          profile_id?: string
          family_id?: string
          reaction_type?: string
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']