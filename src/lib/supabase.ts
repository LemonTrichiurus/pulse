import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 检查是否配置了有效的 Supabase 凭据
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl !== 'https://demo.supabase.co' && 
  supabaseAnonKey !== 'demo-key' &&
  supabaseUrl.includes('supabase.co')

// 客户端 Supabase 实例
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// 服务端 Supabase 实例（用于 API 路由）
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey && isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// 浏览器端客户端
export function createClientComponentClient() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase 未配置，请在 .env.local 中设置正确的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// 检查 Supabase 是否已配置
export const isSupabaseReady = isSupabaseConfigured

// 用户角色类型
export type UserRole = 'ADMIN' | 'MOD' | 'MEMBER'

// 检查用户是否为管理员或版主
export async function isAdminOrMod(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('检查用户权限失败:', error)
    return false
  }
  return data.role === 'ADMIN' || data.role === 'MOD'
}

// 检查用户是否为管理员
export async function isAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('检查管理员权限失败:', error)
    return false
  }
  return data.role === 'ADMIN'
}

// 获取当前用户信息
export async function getCurrentUser() {
  if (!supabase) return null
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// 设置初始管理员
export async function setupAdminUsers(adminEmails: string[]) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin 客户端未配置')
  }
  
  const { error } = await supabaseAdmin.rpc('setup_admin_users', {
    admin_emails: adminEmails
  })

  if (error) {
    console.error('设置管理员失败:', error)
    throw error
  }
}

// 审核评论
export async function moderateComment(
  commentId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { error } = await supabase.rpc('moderate_comment', {
    comment_id: commentId,
    new_status: status,
    moderation_reason: reason
  })

  if (error) {
    console.error('审核评论失败:', error)
    throw error
  }
}

// 批量审核评论
export async function batchModerateComments(
  commentIds: string[],
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data, error } = await supabase.rpc('batch_moderate_comments', {
    comment_ids: commentIds,
    new_status: status,
    moderation_reason: reason
  })

  if (error) {
    console.error('批量审核评论失败:', error)
    throw error
  }

  return data
}

// 锁定/解锁话题
export async function toggleTopicLock(
  topicId: string,
  status: 'OPEN' | 'LOCKED'
) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { error } = await supabase.rpc('toggle_topic_lock', {
    topic_id: topicId,
    lock_status: status
  })

  if (error) {
    console.error('切换话题锁定状态失败:', error)
    throw error
  }
}

// 上传文件到存储桶
export async function uploadFile(file: File, path: string) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file)

  if (error) {
    console.error('文件上传失败:', error)
    throw error
  }

  return data
}

// 获取文件的公开URL
export function getPublicUrl(path: string) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path)

  return data.publicUrl
}

// 生成签名URL（用于私有文件）
export async function getSignedUrl(path: string, expiresIn = 3600) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('生成签名URL失败:', error)
    throw error
  }

  return data.signedUrl
}

// 认证相关函数
export async function signUp(email: string, password: string, displayName: string) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  })

  if (error) {
    console.error('注册失败:', error)
    throw error
  }

  return data
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('登录失败:', error)
    throw error
  }

  return data
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('登出失败:', error)
    throw error
  }
}

export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase 客户端未配置')
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error('重置密码失败:', error)
    throw error
  }
}

// 获取用户会话
export async function getSession() {
  if (!supabase) return null
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('获取会话失败:', error)
    return null
  }
  
  return session
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  if (!supabase) return () => {}
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  
  return () => subscription.unsubscribe()
}