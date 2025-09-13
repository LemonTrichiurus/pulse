'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 输入验证schema
const ShareInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content_rich: z.string().min(1, '内容不能为空'),
  media_url: z.string().url('请输入有效的URL').optional().or(z.literal(''))
})

type ShareInput = z.infer<typeof ShareInputSchema>

// 保存分享草稿
export async function saveShareDraft(input: ShareInput) {
  try {
    const validatedInput = ShareInputSchema.parse(input)
    const supabase = createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { id, ...shareData } = validatedInput
    
    // 处理空字符串的media_url
    const processedData = {
      ...shareData,
      media_url: shareData.media_url || null
    }
    
    if (id) {
      // 更新现有草稿
      const { error } = await supabase
        .from('sharespeare')
        .update({
          ...processedData,
          status: 'DRAFT',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', user.id) // 确保只能更新自己的文章
        .eq('status', 'DRAFT') // 只能更新草稿状态的文章
      
      if (error) {
        console.error('Update share draft error:', error)
        return { success: false, error: '保存草稿失败' }
      }
      
      revalidatePath('/me/submissions')
      return { success: true, message: '草稿已更新', id }
    } else {
      // 创建新草稿
      const { data, error } = await supabase
        .from('sharespeare')
        .insert({
          ...processedData,
          status: 'DRAFT'
          // author_id 不传，触发器自动填充
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('Create share draft error:', error)
        return { success: false, error: '创建草稿失败' }
      }
      
      revalidatePath('/me/submissions')
      return { success: true, message: '草稿已保存', id: data.id }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Save share draft error:', error)
    return { success: false, error: '保存失败' }
  }
}

// 提交分享审核
export async function submitShare(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({ 
        status: 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'DRAFT')
    
    if (error) {
      console.error('Submit share error:', error)
      return { success: false, error: '提交失败' }
    }
    
    revalidatePath('/me/submissions')
    revalidatePath('/admin/review')
    return { success: true, message: '已提交审核' }
  } catch (error) {
    console.error('Submit share error:', error)
    return { success: false, error: '提交失败' }
  }
}

// 返工分享（从REJECTED改为DRAFT）
export async function reworkShare(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('sharespeare')
      .update({ 
        status: 'DRAFT',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'REJECTED')
    
    if (error) {
      console.error('Rework share error:', error)
      return { success: false, error: '返工失败' }
    }
    
    revalidatePath('/me/submissions')
    return { success: true, message: '已返工为草稿' }
  } catch (error) {
    console.error('Rework share error:', error)
    return { success: false, error: '返工失败' }
  }
}

// 删除分享
export async function deleteShare(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
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
      console.error('Delete share error:', error)
      return { success: false, error: '删除失败' }
    }
    
    revalidatePath('/me/submissions')
    return { success: true, message: '已删除' }
  } catch (error) {
    console.error('Delete share error:', error)
    return { success: false, error: '删除失败' }
  }
}