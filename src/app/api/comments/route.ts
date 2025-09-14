import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

// 评论创建验证模式
const commentCreateSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000字符'),
  news_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional() // 回复评论的ID
}).refine(data => data.news_id || data.topic_id, {
  message: '必须指定新闻ID或话题ID'
})

// 评论查询参数验证模式
const commentQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  news_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
  author_id: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional()
})

// GET /api/comments - 获取评论列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    // 检查用户权限，如果是管理员或版主，使用管理员权限查询
    const user = await getCurrentUser(request)
    const isAdmin = user && ['ADMIN', 'MOD'].includes(user.role)
    
    const queryParams = commentQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      news_id: searchParams.get('news_id') || undefined,
      topic_id: searchParams.get('topic_id') || undefined,
      author_id: searchParams.get('author_id') || undefined,
      status: searchParams.get('status') || undefined
    })
    
    const page = parseInt(queryParams.page)
    const limit = Math.min(parseInt(queryParams.limit), 100) // 最大100条
    const offset = (page - 1) * limit
    
    // 如果是管理员或版主，使用管理员客户端绕过RLS限制
    const queryClient = isAdmin ? createSupabaseAdmin() : supabase
    
    // 构建查询 - 为管理界面提供更详细的信息
    let query = queryClient
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(
          id,
          display_name,
          avatar_url,
          email
        ),
        topic:topics(
          id,
          title
        ),
        news:news(
          id,
          title
        ),
        parent:comments!comments_parent_id_fkey(
          id,
          content,
          author:profiles!comments_author_id_fkey(
            display_name
          )
        ),
        replies:comments!comments_parent_id_fkey(
          id,
          content,
          created_at,
          author:profiles!comments_author_id_fkey(
            id,
            display_name,
            avatar_url
          )
        )
      `, { count: 'exact' })
    
    // 应用筛选条件
    if (queryParams.news_id) {
      query = query.eq('news_id', queryParams.news_id)
    }
    
    if (queryParams.topic_id) {
      query = query.eq('topic_id', queryParams.topic_id)
    }
    
    if (queryParams.author_id) {
      query = query.eq('author_id', queryParams.author_id)
    }
    
    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }
    
    // 只获取顶级评论（没有parent_id的评论）
    query = query.is('parent_id', null)
    
    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: comments, error, count } = await query
    
    if (error) {
      console.error('获取评论列表失败:', error)
      return NextResponse.json(
        { error: '获取评论列表失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data: comments,
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

// POST /api/comments - 创建评论
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
    const validatedData = commentCreateSchema.parse(body)
    
    // 验证关联的新闻或话题是否存在
    if (validatedData.news_id) {
      const { data: news, error } = await supabase
        .from('news')
        .select('id, status')
        .eq('id', validatedData.news_id)
        .single()
      
      if (error || !news) {
        return NextResponse.json(
          { error: '新闻不存在' },
          { status: 404 }
        )
      }
      
      // 只有已发布的新闻才能评论
      if (news.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: '该新闻暂不支持评论' },
          { status: 403 }
        )
      }
    }
    
    if (validatedData.topic_id) {
      const { data: topic, error } = await supabase
        .from('topics')
        .select('id, status')
        .eq('id', validatedData.topic_id)
        .single()
      
      if (error || !topic) {
        return NextResponse.json(
          { error: '话题不存在' },
          { status: 404 }
        )
      }
      
      // 只有已批准的话题才能评论
      if (topic.status !== 'APPROVED') {
        return NextResponse.json(
          { error: '该话题暂不支持评论' },
          { status: 403 }
        )
      }
    }
    
    // 如果是回复评论，验证父评论是否存在
    if (validatedData.parent_id) {
      const { data: parentComment, error } = await supabase
        .from('comments')
        .select('id, news_id, topic_id')
        .eq('id', validatedData.parent_id)
        .single()
      
      if (error || !parentComment) {
        return NextResponse.json(
          { error: '父评论不存在' },
          { status: 404 }
        )
      }
      
      // 确保回复的评论属于同一个新闻或话题
      if (validatedData.news_id && parentComment.news_id !== validatedData.news_id) {
        return NextResponse.json(
          { error: '回复评论必须属于同一新闻' },
          { status: 400 }
        )
      }
      
      if (validatedData.topic_id && parentComment.topic_id !== validatedData.topic_id) {
        return NextResponse.json(
          { error: '回复评论必须属于同一话题' },
          { status: 400 }
        )
      }
    }
    
    // 创建评论
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        ...validatedData,
        author_id: user.id,
        status: 'PENDING' // 默认待审核
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(
          id,
          display_name,
          avatar_url
        ),
        parent:comments!comments_parent_id_fkey(
          id,
          content,
          author:profiles!comments_author_id_fkey(
            display_name
          )
        )
      `)
      .single()
    
    if (error) {
      console.error('创建评论失败:', error)
      return NextResponse.json(
        { error: '创建评论失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: comment }, { status: 201 })

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