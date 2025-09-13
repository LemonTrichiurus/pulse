'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 输入验证schema
const NewsInputSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content_rich: z.string().min(1, '内容不能为空'),
  category: z.enum(['campus', 'global'], { errorMap: () => ({ message: '请选择有效的分类' }) })
})

type NewsInput = z.infer<typeof NewsInputSchema>

// 保存新闻草稿
export async function saveNewsDraft(input: NewsInput) {
  try {
    const validatedInput = NewsInputSchema.parse(input)
    const supabase = createSupabaseServer()
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      console.log('Session error:', sessionError)
      return { success: false, error: '请先登录' }
    }
    
    const user = session.user
    console.log('User session:', { id: user.id, email: user.email })

    const { id, ...newsData } = validatedInput
    
    // 转换分类值为数据库格式
    const dbNewsData = {
      ...newsData,
      category: newsData.category.toUpperCase() as 'CAMPUS' | 'GLOBAL'
    }
    
    if (id) {
      // 更新现有草稿
      const { error } = await supabase
        .from('news')
        .update({
          ...dbNewsData,
          status: 'DRAFT',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', user.id) // 确保只能更新自己的文章
        .eq('status', 'DRAFT') // 只能更新草稿状态的文章
      
      if (error) {
        console.error('Update draft error:', error)
        return { success: false, error: '保存草稿失败' }
      }
      
      revalidatePath('/me/submissions')
      return { success: true, message: '草稿已更新', id }
    } else {
      // 创建新草稿
      console.log('Creating draft with data:', {
        ...dbNewsData,
        status: 'DRAFT'
      })
      console.log('User info:', { id: user.id, email: user.email })
      
      const { data, error } = await supabase
        .from('news')
        .insert({
          ...dbNewsData,
          status: 'DRAFT'
          // author_id 不传，触发器自动填充
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('Create draft error:', error)
        return { success: false, error: '创建草稿失败' }
      }
      
      revalidatePath('/me/submissions')
      return { success: true, message: '草稿已保存', id: data.id }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Save draft error:', error)
    return { success: false, error: '保存失败' }
  }
}

// 提交新闻审核
export async function submitNews(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('news')
      .update({ 
        status: 'PENDING',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'DRAFT')
    
    if (error) {
      console.error('Submit news error:', error)
      return { success: false, error: '提交失败' }
    }
    
    revalidatePath('/me/submissions')
    revalidatePath('/admin/review')
    return { success: true, message: '已提交审核' }
  } catch (error) {
    console.error('Submit news error:', error)
    return { success: false, error: '提交失败' }
  }
}

// 返工新闻（从REJECTED改为DRAFT）
export async function reworkNews(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '请先登录' }
    }

    const { error } = await supabase
      .from('news')
      .update({ 
        status: 'DRAFT',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .eq('status', 'REJECTED')
    
    if (error) {
      console.error('Rework news error:', error)
      return { success: false, error: '返工失败' }
    }
    
    revalidatePath('/me/submissions')
    return { success: true, message: '已返工为草稿' }
  } catch (error) {
    console.error('Rework news error:', error)
    return { success: false, error: '返工失败' }
  }
}

// 删除新闻
export async function deleteNews(id: number) {
  try {
    const supabase = createSupabaseServer()
    
    // 获取当前用户
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
      console.error('Delete news error:', error)
      return { success: false, error: '删除失败' }
    }
    
    revalidatePath('/me/submissions')
    return { success: true, message: '已删除' }
  } catch (error) {
    console.error('Delete news error:', error)
    return { success: false, error: '删除失败' }
  }
}