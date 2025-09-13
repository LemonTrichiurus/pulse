'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserSubmissions(status?: string) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    // 获取新闻投稿
    let newsQuery = supabase
      .from('news')
      .select('id, title, content_rich, category, status, created_at, updated_at, published_at, review_note')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'ALL') {
      newsQuery = newsQuery.eq('status', status)
    }

    const { data: newsData, error: newsError } = await newsQuery
    if (newsError) {
      return { success: false, error: '获取新闻投稿失败' }
    }

    // 获取分享投稿
    let shareQuery = supabase
      .from('sharespeare')
      .select('id, title, content_rich, media_url, status, created_at, updated_at, published_at, review_note')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'ALL') {
      shareQuery = shareQuery.eq('status', status)
    }

    const { data: shareData, error: shareError } = await shareQuery
    if (shareError) {
      return { success: false, error: '获取分享投稿失败' }
    }

    // 合并数据并添加类型标识
    const newsWithType = (newsData || []).map(item => ({ ...item, type: 'news' as const }))
    const shareWithType = (shareData || []).map(item => ({ ...item, type: 'share' as const }))
    const allSubmissions = [...newsWithType, ...shareWithType]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { 
      success: true, 
      data: allSubmissions,
      counts: {
        total: allSubmissions.length,
        draft: allSubmissions.filter(item => item.status === 'DRAFT').length,
        pending: allSubmissions.filter(item => item.status === 'PENDING').length,
        published: allSubmissions.filter(item => item.status === 'PUBLISHED').length,
        rejected: allSubmissions.filter(item => item.status === 'REJECTED').length
      }
    }
  } catch (error) {
    console.error('获取投稿列表失败:', error)
    return { success: false, error: '获取投稿列表失败' }
  }
}

export async function reworkNews(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('news')
      .update({ 
        status: 'DRAFT',
        review_note: null,
        reviewed_by: null,
        reviewed_at: null
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'REJECTED')

    if (error) {
      return { success: false, error: '返工失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '已返工为草稿，可以重新编辑' }
  } catch (error) {
    console.error('返工新闻失败:', error)
    return { success: false, error: '返工失败' }
  }
}

export async function reworkShare(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({ 
        status: 'DRAFT',
        review_note: null,
        reviewed_by: null,
        reviewed_at: null
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'REJECTED')

    if (error) {
      return { success: false, error: '返工失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '已返工为草稿，可以重新编辑' }
  } catch (error) {
    console.error('返工分享失败:', error)
    return { success: false, error: '返工失败' }
  }
}

export async function deleteNews(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id)
      .in('status', ['DRAFT', 'PENDING'])

    if (error) {
      return { success: false, error: '删除失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '删除成功' }
  } catch (error) {
    console.error('删除新闻失败:', error)
    return { success: false, error: '删除失败' }
  }
}

export async function deleteShare(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id)
      .in('status', ['DRAFT', 'PENDING'])

    if (error) {
      return { success: false, error: '删除失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '删除成功' }
  } catch (error) {
    console.error('删除分享失败:', error)
    return { success: false, error: '删除失败' }
  }
}

export async function submitNews(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('news')
      .update({ status: 'PENDING' })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'DRAFT')

    if (error) {
      return { success: false, error: '提交失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '已提交审核，请等待管理员审核' }
  } catch (error) {
    console.error('提交新闻失败:', error)
    return { success: false, error: '提交失败' }
  }
}

export async function submitShare(id: number) {
  const supabase = createSupabaseServer()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({ status: 'PENDING' })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'DRAFT')

    if (error) {
      return { success: false, error: '提交失败，请检查权限' }
    }

    revalidatePath('/me/submissions')
    return { success: true, message: '已提交审核，请等待管理员审核' }
  } catch (error) {
    console.error('提交分享失败:', error)
    return { success: false, error: '提交失败' }
  }
}