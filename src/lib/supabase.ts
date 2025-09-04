import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// 检查是否配置了有效的 Supabase 凭据
const isSupabaseConfigured = 
  supabaseUrl !== 'https://demo.supabase.co' && 
  supabaseAnonKey !== 'demo-key' &&
  supabaseUrl.includes('supabase.co')

// 客户端 Supabase 实例
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// 浏览器端客户端
export function createClientComponentClient() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase 未配置，请在 .env.local 中设置正确的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 检查 Supabase 是否已配置
export const isSupabaseReady = isSupabaseConfigured

// TypeScript 类型定义
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          role: 'guest' | 'member' | 'moderator' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          role?: 'guest' | 'member' | 'moderator' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          role?: 'guest' | 'member' | 'moderator' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          content: string
          excerpt: string | null
          featured_image: string | null
          category: 'campus' | 'global' | 'ai' | 'other'
          tags: string[] | null
          author_id: string
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          view_count: number
          search_vector: unknown | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          content: string
          excerpt?: string | null
          featured_image?: string | null
          category: 'campus' | 'global' | 'ai' | 'other'
          tags?: string[] | null
          author_id: string
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          view_count?: number
          search_vector?: unknown | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          content?: string
          excerpt?: string | null
          featured_image?: string | null
          category?: 'campus' | 'global' | 'ai' | 'other'
          tags?: string[] | null
          author_id?: string
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          view_count?: number
          search_vector?: unknown | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          category: 'general' | 'academic' | 'life' | 'tech' | 'other'
          tags: string[] | null
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          like_count: number
          comment_count: number
          last_activity_at: string
          search_vector: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          category: 'general' | 'academic' | 'life' | 'tech' | 'other'
          tags?: string[] | null
          is_pinned?: boolean
          is_locked?: boolean
          view_count?: number
          like_count?: number
          comment_count?: number
          last_activity_at?: string
          search_vector?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          category?: 'general' | 'academic' | 'life' | 'tech' | 'other'
          tags?: string[] | null
          is_pinned?: boolean
          is_locked?: boolean
          view_count?: number
          like_count?: number
          comment_count?: number
          last_activity_at?: string
          search_vector?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_views: {
        Args: {
          table_name: string
          row_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'guest' | 'member' | 'moderator' | 'admin'
      news_category: 'campus' | 'global' | 'ai' | 'other'
      news_status: 'draft' | 'published' | 'archived'
      topic_category: 'general' | 'academic' | 'life' | 'tech' | 'other'
      submission_type: 'news' | 'topic' | 'sharespeare'
      submission_status: 'pending' | 'approved' | 'rejected'
    }
  }
}