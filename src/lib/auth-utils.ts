import { createSupabaseServer } from '@/lib/supabase/server'

export type UserRole = 'ADMIN' | 'MOD' | 'MEMBER'

// 检查用户角色的工具函数
export async function checkUserRole(): Promise<{
  user: { id: string; email: string } | null
  role: UserRole | null
  error?: string
}> {
  try {
    const supabase = await createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Auth user:', user, 'Error:', userError)
    
    if (userError || !user) {
      return { user: null, role: null, error: '用户未登录' }
    }

    // 获取用户角色
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log('Profile data:', profile, 'Error:', profileError)

    if (profileError || !profile) {
      return { user: null, role: null, error: '获取用户信息失败' }
    }

    console.log('User role check result:', {
      userId: user.id,
      email: user.email,
      role: profile.role
    })

    return {
      user: { id: user.id, email: user.email || '' },
      role: profile.role as UserRole
    }
  } catch (error) {
    console.error('检查用户角色失败:', error)
    return { user: null, role: null, error: '检查用户角色失败' }
  }
}