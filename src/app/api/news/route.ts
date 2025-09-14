import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

// 新闻创建/更新的验证模式
const newsSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, '内容不能为空'),
  summary: z.string().max(500, '摘要不能超过500字符').optional(),
  category: z.enum(['CAMPUS', 'GLOBAL']),
  tags: z.array(z.string()).optional(),
  featured_image: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean().optional().default(false),
  // 方案C：置顶排序权重，可为空
  top_rank: z.number().int().nullable().optional(),
  published_at: z.string().datetime().optional()
})

// 查询参数验证模式
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.enum(['CAMPUS', 'GLOBAL']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  featured: z.string().optional(),
  search: z.string().optional(),
  author_id: z.string().uuid().optional()
})

// 内部工具：探测列是否存在（通过选择该列判断）
async function hasColumn(supabase: ReturnType<typeof createSupabaseServer>, table: string, column: string) {
  const { error } = await supabase.from(table).select(`${column}`).limit(1)
  if (error && typeof error.message === 'string' && /column .* does not exist/i.test(error.message)) {
    return false
  }
  // 若无错误或错误非“列不存在”，视为可用（例如表空或权限问题不在此处理）
  return true
}

// GET /api/news - 获取新闻列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const {
      page,
      limit,
      category,
      status,
      featured,
      search,
      author_id
    } = querySchema.parse(queryParams)

    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('news')
      .select(`
        *,
        author:profiles!news_author_id_fkey(
          id,
          display_name,
          avatar_url
        ),
        news_tags(
          tag:tags(name)
        )
      `, { count: 'exact' })

    // 应用筛选条件
    if (category) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    } else {
      // 默认只显示已发布的新闻（除非指定了状态）
      query = query.eq('status', 'PUBLISHED')
    }

    if (author_id) {
      query = query.eq('author_id', author_id)
    }

    // 兼容：数据库无 is_featured 列，若传入 featured=true，仅作为取最新/置顶用途（由排序与 limit 保证）
    // if (featured === 'true') {
    //   query = query.eq('is_featured', true)
    // }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // 排序和分页：若 featured=true 则优先按 top_rank desc 排序；若列不存在自动回退
    const applyOrdering = (q: any, useTop: boolean) => {
      let ordered = q
      if (useTop) {
        ordered = ordered.order('top_rank', { ascending: false, nullsFirst: true })
      }
      ordered = ordered
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      return ordered
    }

    const preferTop = featured === 'true'
    let { data, error, count } = await applyOrdering(query, preferTop)

    // 如果因 top_rank 列不存在导致错误，则回退到不带 top_rank 的排序
    if (error && typeof error.message === 'string' && /column .*top_rank.* does not exist/i.test(error.message)) {
      let fallbackQuery = supabase
        .from('news')
        .select(`
          *,
          author:profiles!news_author_id_fkey(
            id,
            display_name,
            avatar_url
          ),
          news_tags(
            tag:tags(name)
          )
        `, { count: 'exact' })
      
      // 重新应用筛选条件
      const filters = [
        (q: any) => category ? q.eq('category', category) : q,
        (q: any) => status ? q.eq('status', status) : q.eq('status', 'PUBLISHED'),
        (q: any) => author_id ? q.eq('author_id', author_id) : q,
        (q: any) => search ? q.or(`title.ilike.%${search}%,content.ilike.%${search}%`) : q
      ]
      
      fallbackQuery = filters.reduce((acc: any, fn: any) => fn(acc), fallbackQuery)
      
      ({ data, error, count } = await applyOrdering(fallbackQuery, false))
    }

    if (error) {
      console.error('获取新闻列表失败:', error)
      return NextResponse.json(
        { error: '获取新闻列表失败' },
        { status: 500 }
      )
    }

    const mapped = (data || []).map((item: any) => ({
      ...item,
      publish_at: item.published_at
    }))

    return NextResponse.json({
      data: mapped,
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

// POST /api/news - 创建新闻
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    // 检查权限：只有管理员或版主可以创建新闻
    if (!['ADMIN', 'MOD'].includes(user.role)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const supabase = await createSupabaseServer()

    // 兼容旧字段 publish_at
    const rawBody = await request.json()
    const body = rawBody.published_at ? rawBody : { ...rawBody, published_at: rawBody.publish_at }
    const validatedData = newsSchema.parse(body)
    
    // 创建新闻：忽略 is_featured 字段；top_rank 仅在列存在且角色为 ADMIN/MOD 时写入
    const { is_featured: _ignored_is_featured, top_rank: requestedTopRank, ...restValidated } = validatedData as any

    // 探测 top_rank 列
    const topRankAvailable = await hasColumn(supabase, 'news', 'top_rank')
    const canSetTopRank = ['ADMIN', 'MOD'].includes(user.role)

    const newsData: any = {
      ...restValidated,
      author_id: user.id,
      status: restValidated.status || 'PUBLISHED',
      published_at: restValidated.published_at || new Date().toISOString()
    }

    if (topRankAvailable && canSetTopRank && (requestedTopRank ?? null) !== null && requestedTopRank !== undefined) {
      newsData.top_rank = requestedTopRank
    }
    
    const { data: news, error } = await supabase
      .from('news')
      .insert(newsData)
      .select(`
        *,
        author:profiles!news_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('创建新闻失败:', error)
      return NextResponse.json(
        { error: '创建新闻失败' },
        { status: 500 }
      )
    }

    const responseData = { ...news, publish_at: news.published_at }
    return NextResponse.json({ data: responseData })

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