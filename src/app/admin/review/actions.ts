'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPendingSubmissions() {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    // 获取待审核的新闻
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select(`
        id, 
        title, 
        content_rich, 
        category, 
        status, 
        created_at, 
        author_id,
        profiles!news_author_id_fkey(email)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })

    if (newsError) {
      console.error('获取待审核新闻失败:', newsError)
      return { success: false, error: '获取待审核新闻失败' }
    }

    // 获取待审核的分享
    const { data: shareData, error: shareError } = await supabase
      .from('sharespeare')
      .select(`
        id, 
        title, 
        content_rich, 
        media_url, 
        status, 
        created_at, 
        author_id,
        profiles!sharespeare_author_id_fkey(email)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })

    if (shareError) {
      console.error('获取待审核分享失败:', shareError)
      return { success: false, error: '获取待审核分享失败' }
    }

    // 格式化数据
    const newsWithType = (newsData || []).map(item => ({
      ...item,
      type: 'news' as const,
      author_email: item.profiles?.email || '未知用户'
    }))

    const shareWithType = (shareData || []).map(item => ({
      ...item,
      type: 'share' as const,
      author_email: item.profiles?.email || '未知用户'
    }))

    return {
      success: true,
      data: {
        news: newsWithType,
        shares: shareWithType
      }
    }
  } catch (error) {
    console.error('获取待审核内容失败:', error)
    return { success: false, error: '获取待审核内容失败' }
  }
}

export async function approveNews(id: number, note?: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    const { error } = await supabase
      .from('news')
      .update({
        status: 'PUBLISHED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null
      })
      .eq('id', id)
      .eq('status', 'PENDING')

    if (error) {
      console.error('审核通过新闻失败:', error)
      return { success: false, error: '审核失败，请检查权限' }
    }

    revalidatePath('/admin/review')
    return { success: true, message: '新闻审核通过' }
  } catch (error) {
    console.error('审核通过新闻失败:', error)
    return { success: false, error: '审核失败' }
  }
}

export async function rejectNews(id: number, note: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    if (!note.trim()) {
      return { success: false, error: '拒绝时必须填写审核意见' }
    }

    const { error } = await supabase
      .from('news')
      .update({
        status: 'REJECTED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note
      })
      .eq('id', id)
      .eq('status', 'PENDING')

    if (error) {
      console.error('拒绝新闻失败:', error)
      return { success: false, error: '审核失败，请检查权限' }
    }

    revalidatePath('/admin/review')
    return { success: true, message: '新闻已拒绝' }
  } catch (error) {
    console.error('拒绝新闻失败:', error)
    return { success: false, error: '审核失败' }
  }
}

export async function approveShare(id: number, note?: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({
        status: 'PUBLISHED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null
      })
      .eq('id', id)
      .eq('status', 'PENDING')

    if (error) {
      console.error('审核通过分享失败:', error)
      return { success: false, error: '审核失败，请检查权限' }
    }

    revalidatePath('/admin/review')
    return { success: true, message: '分享审核通过' }
  } catch (error) {
    console.error('审核通过分享失败:', error)
    return { success: false, error: '审核失败' }
  }
}

export async function rejectShare(id: number, note: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    if (!note.trim()) {
      return { success: false, error: '拒绝时必须填写审核意见' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({
        status: 'REJECTED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note
      })
      .eq('id', id)
      .eq('status', 'PENDING')

    if (error) {
      console.error('拒绝分享失败:', error)
      return { success: false, error: '审核失败，请检查权限' }
    }

    revalidatePath('/admin/review')
    return { success: true, message: '分享已拒绝' }
  } catch (error) {
    console.error('拒绝分享失败:', error)
    return { success: false, error: '审核失败' }
  }
}

export async function updateReviewNote(id: number, type: 'news' | 'share', note: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户权限
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足' }
    }

    const tableName = type === 'news' ? 'news' : 'sharespeare'
    const { error } = await supabase
      .from(tableName)
      .update({ review_note: note })
      .eq('id', id)
      .eq('status', 'PENDING')

    if (error) {
      console.error('更新审核备注失败:', error)
      return { success: false, error: '更新失败' }
    }

    return { success: true, message: '备注已更新' }
  } catch (error) {
    console.error('更新审核备注失败:', error)
    return { success: false, error: '更新失败' }
  }
}