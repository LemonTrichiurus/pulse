import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

// 新闻更新的验证模式
const newsUpdateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  summary: z.string().max(500, '摘要不能超过500字符').optional(),
  category: z.enum(['CAMPUS', 'GLOBAL']).optional(),
  tags: z.array(z.string()).optional(),
  featured_image: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean().optional(),
  top_rank: z.number().int().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  published_at: z.string().datetime().optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/news/[id] - 获取单个新闻
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createSupabaseServer()
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: '新闻ID不能为空' },
        { status: 400 }
      )
    }
    
    const { data: news, error } = await supabase
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
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '新闻不存在' },
          { status: 404 }
        )
      }
      
      console.error('获取新闻详情失败:', error)
      return NextResponse.json(
        { error: '获取新闻详情失败' },
        { status: 500 }
      )
    }
    
    // 检查权限：未发布的新闻只有作者和管理员可以查看
    if (news.status !== 'PUBLISHED') {
      const user = await getCurrentUser(request)
      if (!user || (user.id !== news.author_id && !['ADMIN', 'MOD'].includes(user.role))) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        )
      }
    }
    
    // 增加浏览量
    await supabase
      .from('news')
      .update({ views: (news.views || 0) + 1 })
      .eq('id', id)
    
    const mapped = { ...news, publish_at: news.published_at }
    return NextResponse.json({ data: mapped })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// PUT /api/news/[id] - 更新新闻
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseServer()
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: '新闻ID不能为空' },
        { status: 400 }
      )
    }
    
    // 获取现有新闻
    const { data: existingNews, error: fetchError } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '新闻不存在' },
          { status: 404 }
        )
      }
      
      console.error('获取新闻失败:', fetchError)
      return NextResponse.json(
        { error: '获取新闻失败' },
        { status: 500 }
      )
    }
    
    // 检查权限：只有作者本人或管理员/版主可以编辑
    if (user.id !== existingNews.author_id && !['ADMIN', 'MOD'].includes(user.role)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const rawBody = await request.json()
    const body = rawBody.published_at ? rawBody : { ...rawBody, published_at: rawBody.publish_at }

    // 解析校验并根据权限过滤 top_rank
    let validatedData = newsUpdateSchema.parse(body) as any
    const canSetTopRank = ['ADMIN', 'MOD'].includes(user.role)
    if (!canSetTopRank && Object.prototype.hasOwnProperty.call(validatedData, 'top_rank')) {
      delete validatedData.top_rank
    }

    // 如果是非管理角色编辑已发布的文章，需要重新审核（退回草稿）
    const updateData = { ...validatedData }
    if (!['ADMIN', 'MOD'].includes(user.role) && existingNews.status === 'PUBLISHED' && Object.keys(validatedData).length > 0) {
      updateData.status = 'DRAFT'
    }

    const { data: updatedNews, error } = await supabase
       .from('news')
       .update(updateData)
       .eq('id', id)
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
       `)
       .single()

    if (error) {
      console.error('更新新闻失败:', error)
      return NextResponse.json(
        { error: '更新新闻失败' },
        { status: 500 }
      )
    }

    // 处理标签
    if (validatedData.tags) {
      // 删除现有标签关联
      await supabase
        .from('news_tags')
        .delete()
        .eq('news_id', id)
      
      // 添加新标签关联
      if (validatedData.tags.length > 0) {
        // 依次查找或创建标签，拿到 tag_id
        const tagIds = await Promise.all(
          validatedData.tags.map(async (tagName) => {
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .single()

            if (existingTag) return existingTag.id

            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('id')
              .single()

            return newTag?.id
          })
        )

        const newsTagsData = tagIds
          .filter(Boolean)
          .map(tagId => ({ news_id: id, tag_id: tagId }))

        if (newsTagsData.length > 0) {
          await supabase
            .from('news_tags')
            .insert(newsTagsData)
        }
      }
    }

    const responseData = { ...updatedNews, publish_at: updatedNews.published_at }
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

// DELETE /api/news/[id] - 删除新闻
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseServer()

    const { id } = params

    // 验证ID格式
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { error: '无效的新闻ID' },
        { status: 400 }
      )
    }

    // 用户权限已在上面验证过

    // 检查新闻是否存在
    const { data: existingNews, error: fetchError } = await supabase
      .from('news')
      .select('id, author_id, title')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '新闻不存在' },
          { status: 404 }
        )
      }
      console.error('获取新闻失败:', fetchError)
      return NextResponse.json(
        { error: '获取新闻失败' },
        { status: 500 }
      )
    }

    // 检查删除权限（作者或管理员/版主）
    if (user.id !== existingNews.author_id && !['ADMIN', 'MOD'].includes(user.role)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 先删除关联的标签
    await supabase
      .from('news_tags')
      .delete()
      .eq('news_id', id)

    // 删除新闻
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除新闻失败:', error)
      return NextResponse.json(
        { error: '删除新闻失败' },
        { status: 500 }
      )
    }



    return NextResponse.json({ message: '新闻删除成功' })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}