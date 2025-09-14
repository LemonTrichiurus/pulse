'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 发表评论的表单验证
const postCommentSchema = z.object({
  topicId: z.string().min(1, '话题ID不能为空'),
  body_rich: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000字符'),
})

// 发表评论 - 任意登录用户可调用
export async function postComment(formData: FormData) {
  const supabase = await createSupabaseServer()
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('请先登录')
  }

  // 确保用户有profile记录
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('用户信息不完整，请联系管理员')
  }

  // 验证表单数据
  const validatedFields = postCommentSchema.safeParse({
    topicId: formData.get('topicId'),
    body_rich: formData.get('body_rich'),
  })

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors[0].message)
  }

  const { topicId, body_rich } = validatedFields.data

  // 检查话题是否存在且状态为 OPEN
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, status')
    .eq('id', topicId)
    .single()

  if (topicError || !topic) {
    throw new Error('话题不存在')
  }

  if (topic.status !== 'OPEN') {
    throw new Error('该话题已锁定，无法评论')
  }

  // 使用Service Role客户端绕过RLS策略
  const serviceClient = createServiceClient()
  
  // 插入评论
  const { error } = await serviceClient
    .from('comments')
    .insert({
      topic_id: topicId,
      author_id: user.id,
      body_rich,
      status: 'PENDING',
    })

  if (error) {
    console.error('发表评论失败:', error)
    throw new Error('发表评论失败')
  }

  revalidatePath(`/topics/${topicId}`)
  revalidatePath('/admin/comments')
  
  return { success: true, message: '已提交待审核' }
}

// 审核通过评论 - 仅 MOD/ADMIN 可调用
export async function approveComment(commentId: string) {
  try {
    const supabase = await createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('approveComment - 用户认证状态:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      console.error('approveComment - 用户认证失败:', userError)
      return { success: false, error: '请先登录' }
    }

    // 获取用户角色
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('获取用户信息失败:', profileError)
      return { success: false, error: '获取用户信息失败' }
    }

    // 检查权限
    if (!['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足，只有管理员和版主可以审核评论' }
    }

    // 获取评论信息（用于后续刷新页面）
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('topic_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      console.error('评论不存在:', commentError)
      return { success: false, error: '评论不存在' }
    }

    // 更新评论状态 - 使用 Service Role 客户端绕过 RLS 限制
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('comments')
      .update({ 
        status: 'APPROVED',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (error) {
      console.error('审核评论失败:', error)
      return { success: false, error: '审核评论失败' }
    }

    revalidatePath(`/topics/${comment.topic_id}`)
    revalidatePath('/admin/comments')
    revalidatePath('/topics')
    
    return { success: true, message: '评论已审核通过' }
  } catch (error) {
    console.error('approveComment 异常:', error)
    return { success: false, error: '审核失败' }
  }
}

// 拒绝评论 - 仅 MOD/ADMIN 可调用
export async function rejectComment(commentId: string, reason?: string) {
  try {
    const supabase = await createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('rejectComment - 用户认证状态:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      console.error('rejectComment - 用户认证失败:', userError)
      return { success: false, error: '请先登录' }
    }

    // 获取用户角色
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('获取用户信息失败:', profileError)
      return { success: false, error: '获取用户信息失败' }
    }

    // 检查权限
    if (!['MOD', 'ADMIN'].includes(profile.role)) {
      return { success: false, error: '权限不足，只有管理员和版主可以审核评论' }
    }

    // 获取评论信息（用于后续刷新页面）
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('topic_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      console.error('评论不存在:', commentError)
      return { success: false, error: '评论不存在' }
    }

    // 更新评论状态 - 使用 Service Role 客户端绕过 RLS 限制
    const updateData: { status: string; reason?: string; moderated_by: string; moderated_at: string } = { 
      status: 'REJECTED',
      moderated_by: user.id,
      moderated_at: new Date().toISOString()
    }
    if (reason) {
      updateData.reason = reason
    }

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('comments')
      .update(updateData)
      .eq('id', commentId)

    if (error) {
      console.error('拒绝评论失败:', error)
      return { success: false, error: '拒绝评论失败' }
    }

    revalidatePath(`/topics/${comment.topic_id}`)
    revalidatePath('/admin/comments')
    
    return { success: true, message: '评论已被拒绝' }
  } catch (error) {
    console.error('rejectComment 异常:', error)
    return { success: false, error: '拒绝失败' }
  }
}

// 删除评论 - 仅 MOD/ADMIN 可调用
export async function deleteComment(commentId: string) {
  const supabase = await createSupabaseServer()
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('请先登录')
  }

  // 获取用户角色
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('获取用户信息失败')
  }

  // 检查权限
  if (!['MOD', 'ADMIN'].includes(profile.role)) {
    throw new Error('权限不足，只有管理员和版主可以删除评论')
  }

  // 获取评论信息（用于后续刷新页面）
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('topic_id')
    .eq('id', commentId)
    .single()

  if (commentError || !comment) {
    throw new Error('评论不存在')
  }

  // 删除评论
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('删除评论失败:', error)
    throw new Error('删除评论失败')
  }

  revalidatePath(`/topics/${comment.topic_id}`)
  revalidatePath('/admin/comments')
  revalidatePath('/topics')
  
  return { success: true, message: '评论已删除' }
}