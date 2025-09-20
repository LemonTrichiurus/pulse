export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          role: 'ADMIN' | 'MOD' | 'MEMBER'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          role?: 'ADMIN' | 'MOD' | 'MEMBER'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          role?: 'ADMIN' | 'MOD' | 'MEMBER'
          created_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          content_rich: string
          cover_url: string | null
          category: 'CAMPUS' | 'GLOBAL'
          published_at: string | null
          author_id: string
          status: 'DRAFT' | 'PUBLISHED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content_rich: string
          cover_url?: string | null
          category: 'CAMPUS' | 'GLOBAL'
          published_at?: string | null
          author_id: string
          status?: 'DRAFT' | 'PUBLISHED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content_rich?: string
          cover_url?: string | null
          category?: 'CAMPUS' | 'GLOBAL'
          published_at?: string | null
          author_id?: string
          status?: 'DRAFT' | 'PUBLISHED'
          created_at?: string
          updated_at?: string
        }
      }
      sharespeare: {
        Row: {
          id: string
          title: string
          content_rich: string
          media_url: string | null
          media_urls: string[] | null
          author_id: string
          published_at: string | null
          status: 'DRAFT' | 'PUBLISHED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content_rich: string
          media_url?: string | null
          media_urls?: string[] | null
          author_id: string
          published_at?: string | null
          status?: 'DRAFT' | 'PUBLISHED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content_rich?: string
          media_url?: string | null
          media_urls?: string[] | null
          author_id?: string
          published_at?: string | null
          status?: 'DRAFT' | 'PUBLISHED'
          created_at?: string
          updated_at?: string
        }
      }
      homepage_config: {
        Row: {
          id: string
          config_key: string
          config_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          title: string
          body_rich: string
          author_id: string
          status: 'OPEN' | 'LOCKED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body_rich: string
          author_id: string
          status?: 'OPEN' | 'LOCKED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          body_rich?: string
          author_id?: string
          status?: 'OPEN' | 'LOCKED'
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          topic_id: string
          author_id: string
          body_rich: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          created_at: string
          moderated_by: string | null
          moderated_at: string | null
          reason: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          author_id: string
          body_rich: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          created_at?: string
          moderated_by?: string | null
          moderated_at?: string | null
          reason?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          author_id?: string
          body_rich?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          created_at?: string
          moderated_by?: string | null
          moderated_at?: string | null
          reason?: string | null
        }
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          date: string
          type: 'EXAM' | 'EVENT'
          source: 'AP' | 'UCLA' | 'OTHER'
          description: string | null
          created_by: string
          visibility: 'PUBLIC' | 'PRIVATE'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          type: 'EXAM' | 'EVENT'
          source: 'AP' | 'UCLA' | 'OTHER'
          description?: string | null
          created_by: string
          visibility?: 'PUBLIC' | 'PRIVATE'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          type?: 'EXAM' | 'EVENT'
          source?: 'AP' | 'UCLA' | 'OTHER'
          description?: string | null
          created_by?: string
          visibility?: 'PUBLIC' | 'PRIVATE'
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      news_tags: {
        Row: {
          news_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          news_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          news_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string
          action: string
          entity: string
          entity_id: string
          meta: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          entity: string
          entity_id: string
          meta?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          entity?: string
          entity_id?: string
          meta?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      setup_admin_users: {
        Args: {
          admin_emails: string[]
        }
        Returns: undefined
      }
      moderate_comment: {
        Args: {
          comment_id: string
          new_status: 'APPROVED' | 'REJECTED'
          moderation_reason?: string
        }
        Returns: undefined
      }
      batch_moderate_comments: {
        Args: {
          comment_ids: string[]
          new_status: 'APPROVED' | 'REJECTED'
          moderation_reason?: string
        }
        Returns: number
      }
      toggle_topic_lock: {
        Args: {
          topic_id: string
          lock_status: 'OPEN' | 'LOCKED'
        }
        Returns: undefined
      }
      log_audit: {
        Args: {
          actor_id: string
          action: string
          entity: string
          entity_id: string
          meta?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'ADMIN' | 'MOD' | 'MEMBER'
      news_category: 'CAMPUS' | 'GLOBAL'
      news_status: 'DRAFT' | 'PUBLISHED'
      topic_status: 'OPEN' | 'LOCKED'
      comment_status: 'PENDING' | 'APPROVED' | 'REJECTED'
      event_type: 'EXAM' | 'EVENT'
      event_source: 'AP' | 'UCLA' | 'OTHER'
      event_visibility: 'PUBLIC' | 'PRIVATE'
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never