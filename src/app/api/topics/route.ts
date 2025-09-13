import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

// 话题创建验证模式
const topicCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, '内容不能为空'),
  category: z.enum(['ACADEMIC', 'LIFE', 'ACTIVITY', 'DISCUSSION', 'OTHER']),
  tags: z.array(z.string()).optional().default([])
})

// 话题查询参数验证模式
const topicQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  category: z.enum(['ACADEMIC', 'LIFE', 'ACTIVITY', 'DISCUSSION', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  author_id: z.string().uuid().optional(),
  search: z.string().optional()
})

// GET /api/topics - 获取话题列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    const queryParams = topicQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      author_id: searchParams.get('author_id') || undefined,
      search: searchParams.get('search') || undefined
    })
    
    const page = parseInt(queryParams.page)
    const limit = Math.min(parseInt(queryParams.limit), 50) // 最大50条
    const offset = (page - 1) * limit
    
    // 构建查询
    let query = supabase
      .from('topics')
      .select(`
        *,
        author:profiles!topics_author_id_fkey(
          id,
          display_name,
          avatar_url
        ),
        topic_tags(
          tag:tags(name, color)
        ),
        _count:comments(count)
      `, { count: 'exact' })
    
    // 应用筛选条件
    if (queryParams.category) {
      query = query.eq('category', queryParams.category)
    }
    
    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }
    
    if (queryParams.author_id) {
      query = query.eq('author_id', queryParams.author_id)
    }
    
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,content.ilike.%${queryParams.search}%`)
    }
    
    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: topics, error, count } = await query
    
    if (error) {
      console.error('获取话题列表失败:', error)
      return NextResponse.json(
        { error: '获取话题列表失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data: topics,
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

// POST /api/topics - 创建话题
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseServer()
    const body = await request.json()
    const validatedData = topicCreateSchema.parse(body)

    // 创建话题
    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        ...validatedData,
        author_id: user.id,
        status: 'PENDING' // 默认待审核
      })
      .select(`
        *,
        author:profiles!topics_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .single()
    
    if (error) {
      console.error('创建话题失败:', error)
      return NextResponse.json(
        { error: '创建话题失败' },
        { status: 500 }
      )
    }
    
    // 处理标签
    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagInserts = validatedData.tags.map(tagName => ({
        topic_id: topic.id,
        tag_name: tagName
      }))
      
      await supabase
        .from('topic_tags')
        .insert(tagInserts)
    }
    
    return NextResponse.json({ data: topic }, { status: 201 })

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