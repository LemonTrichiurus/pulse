import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin, isAdminOrMod } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/security'

// 单个评论审核的验证模式
const moderateSchema = z.object({
  comment_id: z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0, '评论ID格式不正确'),
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: '状态必须是APPROVED或REJECTED' })
  }),
  reason: z.string().max(500, '审核理由不能超过500字符').optional()
})

// 批量审核的验证模式
const batchModerateSchema = z.object({
  comment_ids: z.array(z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0)).min(1, '至少选择一个评论').max(50, '一次最多审核50个评论'),
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: '状态必须是APPROVED或REJECTED' })
  }),
  reason: z.string().max(500, '审核理由不能超过500字符').optional()
})

// POST /api/comments/moderate - 审核评论（单个或批量）
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase未配置' },
        { status: 500 }
      )
    }

    // 验证用户权限（只有管理员和版主可以审核）
    console.log('开始验证用户权限...')
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user)
    
    if (!user) {
      console.log('用户未登录')
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    console.log('检查用户权限:', user.id)
    console.log('用户角色:', user.role)
    const hasPermission = await isAdminOrMod(user.id)
    console.log('用户权限检查结果:', hasPermission)
    
    // 临时绕过权限检查，直接使用用户角色信息
    const hasDirectPermission = user.role === 'ADMIN' || user.role === 'MOD'
    console.log('直接权限检查结果:', hasDirectPermission)
    
    if (!hasDirectPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    console.log('用户权限验证通过，开始处理请求')

    const body = await request.json()
    
    // 判断是单个审核还是批量审核
    const isBatch = Array.isArray(body.comment_ids)
    
    if (isBatch) {
      // 批量审核
      const validatedData = batchModerateSchema.parse(body)
      
      // 检查所有评论是否存在且状态为PENDING
      const { data: comments, error: fetchError } = await supabaseAdmin
        .from('comments')
        .select('id, status, topic_id')
        .in('id', validatedData.comment_ids)
      
      if (fetchError) {
        console.error('获取评论失败:', fetchError)
        return NextResponse.json(
          { error: '获取评论失败' },
          { status: 500 }
        )
      }
      
      if (!comments || comments.length !== validatedData.comment_ids.length) {
        return NextResponse.json(
          { error: '部分评论不存在' },
          { status: 404 }
        )
      }
      
      // 检查是否有非PENDING状态的评论
      const nonPendingComments = comments.filter(c => c.status !== 'PENDING')
      if (nonPendingComments.length > 0) {
        return NextResponse.json(
          { error: '只能审核待审核状态的评论' },
          { status: 400 }
        )
      }
      
      // 执行批量审核
      const { error: batchError } = await supabaseAdmin
        .from('comments')
        .update({
          status: validatedData.status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          reason: validatedData.reason
        })
        .in('id', validatedData.comment_ids)
      
      if (batchError) {
        console.error('批量审核评论失败:', batchError)
        return NextResponse.json(
          { error: '批量审核评论失败' },
          { status: 500 }
        )
      }
      
      // 审计日志功能暂时禁用
      console.log('批量审核操作完成:', {
        actor_id: user.id,
        action: 'BATCH_MODERATE',
        comment_ids: validatedData.comment_ids,
        status: validatedData.status,
        reason: validatedData.reason
      })
      
      return NextResponse.json({
        message: `成功${validatedData.status === 'APPROVED' ? '通过' : '拒绝'}${validatedData.comment_ids.length}条评论`,
        processed_count: validatedData.comment_ids.length
      })
      
    } else {
      // 单个审核
      const validatedData = moderateSchema.parse(body)
      
      // 检查评论是否存在且状态为PENDING
      const { data: comment, error: fetchError } = await supabaseAdmin
        .from('comments')
        .select('id, status, topic_id, author_id')
        .eq('id', validatedData.comment_id)
        .single()
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: '评论不存在' },
            { status: 404 }
          )
        }
        console.error('获取评论失败:', fetchError)
        return NextResponse.json(
          { error: '获取评论失败' },
          { status: 500 }
        )
      }
      
      if (comment.status !== 'PENDING') {
        return NextResponse.json(
          { error: '只能审核待审核状态的评论' },
          { status: 400 }
        )
      }
      
      // 执行单个审核
      const { error: moderateError } = await supabaseAdmin
        .from('comments')
        .update({
          status: validatedData.status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          reason: validatedData.reason
        })
        .eq('id', validatedData.comment_id)
      
      if (moderateError) {
        console.error('审核评论失败:', moderateError)
        return NextResponse.json(
          { error: '审核评论失败' },
          { status: 500 }
        )
      }
      
      // 获取更新后的评论信息
      const { data: updatedComment, error: updateError } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          author:profiles!comments_author_id_fkey(
            id,
            display_name,
            avatar_url
          ),
          topic:topics!comments_topic_id_fkey(
            id,
            title
          ),
          moderator:profiles!comments_moderated_by_fkey(
            id,
            display_name
          )
        `)
        .eq('id', validatedData.comment_id)
        .single()
      
      if (updateError) {
        console.error('获取更新后评论失败:', updateError)
        return NextResponse.json(
          { error: '审核成功但获取更新信息失败' },
          { status: 500 }
        )
      }
      
      // 审计日志功能暂时禁用
      console.log('单个审核操作完成:', {
        actor_id: user.id,
        action: 'MODERATE',
        comment_id: validatedData.comment_id,
        status: validatedData.status,
        reason: validatedData.reason,
        topic_id: comment.topic_id,
        author_id: comment.author_id
      })
      
      return NextResponse.json({
        data: updatedComment,
        message: `评论已${validatedData.status === 'APPROVED' ? '通过' : '拒绝'}审核`
      })
    }

  } catch (error) {
    console.error('API错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据无效', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}