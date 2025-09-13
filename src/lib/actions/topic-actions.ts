'use server'

import { createServiceClient } from '@/lib/supabase/service-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { checkUserRole } from '@/lib/auth-utils'

// 创建话题的表单验证
const createTopicSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  body_rich: z.string().min(1, '内容不能为空'),
})

// 创建话题 - 仅 MOD/ADMIN 可调用
export async function createTopic(formData: FormData) {
  try {
    // 权限检查
    const { user, role } = await checkUserRole()
    if (!user || !['ADMIN', 'MOD'].includes(role)) {
      return { success: false, error: '权限不足' }
    }

    // 表单验证
    const validatedFields = createTopicSchema.safeParse({
      title: formData.get('title'),
      body_rich: formData.get('body_rich'),
    })

    if (!validatedFields.success) {
      return { success: false, error: '表单验证失败' }
    }

    const { title, body_rich } = validatedFields.data

    // 使用Service Role客户端绕过RLS策略
    const serviceClient = createServiceClient()

    // 插入话题
    const { error } = await serviceClient
      .from('topics')
      .insert({
        title,
        body_rich,
        status: 'OPEN',
        author_id: user.id,
      })

    if (error) {
      console.error('创建话题失败:', error)
      return { success: false, error: '创建话题失败' }
    }

    revalidatePath('/topics')
    revalidatePath('/admin/topics')
    return { success: true, message: '话题创建成功' }
  } catch (error) {
    console.error('创建话题失败:', error)
    return { success: false, error: '创建话题失败' }
  }
}

// 锁定话题 - 仅 MOD/ADMIN 可调用
export async function lockTopic(topicId: string) {
  try {
    // 权限检查
    const { user, role } = await checkUserRole()
    if (!user || !['ADMIN', 'MOD'].includes(role)) {
      return { success: false, error: '权限不足' }
    }

    // 使用Service Role客户端绕过RLS策略
    const serviceClient = createServiceClient()

    // 更新话题状态
    const { error } = await serviceClient
      .from('topics')
      .update({ status: 'LOCKED' })
      .eq('id', topicId)

    if (error) {
      console.error('锁定话题失败:', error)
      return { success: false, error: '锁定话题失败' }
    }

    revalidatePath('/topics')
    revalidatePath('/admin/topics')
    revalidatePath(`/topics/${topicId}`)
    return { success: true, message: '话题已锁定' }
  } catch (error) {
    console.error('锁定话题失败:', error)
    return { success: false, error: '锁定话题失败' }
  }
}

// 解锁话题 - 仅 MOD/ADMIN 可调用
export async function unlockTopic(topicId: string) {
  try {
    // 权限检查
    const { user, role } = await checkUserRole()
    if (!user || !['ADMIN', 'MOD'].includes(role)) {
      return { success: false, error: '权限不足' }
    }

    // 使用Service Role客户端绕过RLS策略
    const serviceClient = createServiceClient()

    // 更新话题状态
    const { error } = await serviceClient
      .from('topics')
      .update({ status: 'OPEN' })
      .eq('id', topicId)

    if (error) {
      console.error('解锁话题失败:', error)
      return { success: false, error: '解锁话题失败' }
    }

    revalidatePath('/topics')
    revalidatePath('/admin/topics')
    revalidatePath(`/topics/${topicId}`)
    return { success: true, message: '话题已解锁' }
  } catch (error) {
    console.error('解锁话题失败:', error)
    return { success: false, error: '解锁话题失败' }
  }
}

// 删除话题 - 仅 MOD/ADMIN 可调用
export async function deleteTopic(topicId: string) {
  try {
    // 权限检查
    const { user, role } = await checkUserRole()
    if (!user || !['ADMIN', 'MOD'].includes(role)) {
      return { success: false, error: '权限不足' }
    }

    // 使用Service Role客户端绕过RLS策略
    const serviceClient = createServiceClient()

    // 删除话题（级联删除评论由数据库处理）
    const { error } = await serviceClient
      .from('topics')
      .delete()
      .eq('id', topicId)

    if (error) {
      console.error('删除话题失败:', error)
      return { success: false, error: '删除话题失败' }
    }

    revalidatePath('/topics')
    revalidatePath('/admin/topics')
    return { success: true, message: '话题删除成功' }
  } catch (error) {
    console.error('删除话题失败:', error)
    return { success: false, error: '删除话题失败' }
  }
}