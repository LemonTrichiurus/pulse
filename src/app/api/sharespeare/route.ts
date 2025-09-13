import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

// 创建/更新莎士比亚作品的验证模式
const sharespeareCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content_rich: z.string().min(1, '内容不能为空'),
  media_url: z.string().url().optional().nullable()
})

// 查询参数验证模式
const sharespeareQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  author_id: z.string().uuid().optional(),
  search: z.string().optional()
})

// GET /api/sharespeare - 获取莎士比亚作品列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    const queryParams = sharespeareQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      author_id: searchParams.get('author_id') || undefined,
      search: searchParams.get('search') || undefined
    })
    
    const page = parseInt(queryParams.page)
    const limit = Math.min(parseInt(queryParams.limit), 100)
    const offset = (page - 1) * limit
    
    // 构建查询
    let query = supabase
      .from('sharespeare')
      .select(`
        *,
        author:profiles!sharespeare_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
    
    // 应用筛选条件
    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }
    
    if (queryParams.author_id) {
      query = query.eq('author_id', queryParams.author_id)
    }
    
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,content_rich.ilike.%${queryParams.search}%`)
    }
    
    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('获取莎士比亚作品失败:', error)
      return NextResponse.json(
        { error: '获取作品失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数无效', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// POST /api/sharespeare - 创建新的莎士比亚作品
export async function POST(request: NextRequest) {
   try {
    const user = await getCurrentUser(request)
     if (!user) {
       return NextResponse.json(
         { error: '请先登录' },
         { status: 401 }
       )
     }
    
    const supabase = await createSupabaseServer()
    const body = await request.json()
    const validatedData = sharespeareCreateSchema.parse(body)
    
    // 创建莎士比亚作品
    const { data: sharespeare, error } = await supabase
      .from('sharespeare')
      .insert({
        ...validatedData,
        author_id: user.id,
        status: 'PENDING' // 默认待审核
      })
      .select(`
        *,
        author:profiles!sharespeare_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .single()
    
    if (error) {
      console.error('创建莎士比亚作品失败:', error)
      return NextResponse.json(
        { error: '创建作品失败' },
        { status: 500 }
      )
    }
    
    // 处理标签
    if (validatedData.tags && validatedData.tags.length > 0) {
      // 获取或创建标签
      const tagPromises = validatedData.tags.map(async (tagName) => {
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single()
        
        if (existingTag) {
          return existingTag.id
        }
        
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single()
        
        return newTag?.id
      })
      
      const tagIds = (await Promise.all(tagPromises)).filter(Boolean)
      
      // 创建作品-标签关联
      if (tagIds.length > 0) {
        await supabase
          .from('sharespeare_tags')
          .insert(
            tagIds.map(tagId => ({
              sharespeare_id: sharespeare.id,
              tag_id: tagId
            }))
          )
      }
    }
    
    return NextResponse.json({ data: sharespeare }, { status: 201 })

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