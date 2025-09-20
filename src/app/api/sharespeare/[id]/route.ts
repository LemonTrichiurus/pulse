import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/security'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/sharespeare/[id] - 更新莎士比亚作品
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServer()
    const supabaseAdmin = createSupabaseAdmin()
    const { id } = (await params)
    
    if (!id) {
      return NextResponse.json(
        { error: '文章ID不能为空' },
        { status: 400 }
      )
    }

    // 检查文章是否存在以及用户权限
    const { data: existingShare, error: fetchError } = await supabaseAdmin
      .from('sharespeare')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingShare) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    // 检查权限：只有作者、管理员或版主可以编辑
    if (existingShare.author_id !== user.id && !['ADMIN', 'MOD'].includes(user.role)) {
      return NextResponse.json(
        { error: '没有权限编辑此文章' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = sharespeareUpdateSchema.parse(body)

    // 更新文章
    const { data: updatedShare, error: updateError } = await supabaseAdmin
      .from('sharespeare')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        author:profiles!sharespeare_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('更新文章失败:', updateError)
      return NextResponse.json(
        { error: '更新文章失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedShare })

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

// DELETE /api/sharespeare/[id] - 删除莎士比亚作品
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServer()
    const { id } = (await params)
    
    if (!id) {
      return NextResponse.json(
        { error: '文章ID不能为空' },
        { status: 400 }
      )
    }

    // 检查文章是否存在以及用户权限
    const { data: existingShare, error: fetchError } = await supabase
      .from('sharespeare')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingShare) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    // 检查权限：只有作者或管理员可以删除
    if (existingShare.author_id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '没有权限删除此文章' },
        { status: 403 }
      )
    }

    // 删除文章
    const { error: deleteError } = await supabase
      .from('sharespeare')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('删除文章失败:', deleteError)
      return NextResponse.json(
        { error: '删除文章失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '文章删除成功' })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新莎士比亚作品的验证模式
const sharespeareUpdateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content_rich: z.string().min(1, '内容不能为空').optional(),
  media_url: z.string().url().optional().nullable(),
  media_urls: z.array(z.string().url()).max(10, '最多只能上传10张图片').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional()
})

// GET /api/sharespeare/[id] - 获取单个莎士比亚作品
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createSupabaseServer()
    const { id } = (await params)
    
    if (!id) {
      return NextResponse.json(
        { error: '文章ID不能为空' },
        { status: 400 }
      )
    }
    
    const { data: share, error } = await supabase
      .from('sharespeare')
      .select(`
        *,
        author:profiles!sharespeare_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        )
      }
      
      console.error('获取文章详情失败:', error)
      return NextResponse.json(
        { error: '获取文章详情失败' },
        { status: 500 }
      )
    }
    
    // 检查文章状态：未发布的文章只有作者可以查看
    if (share.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '文章未发布' },
        { status: 403 }
      )
    }
    
    // 增加浏览量（如果有view_count字段）
    if ('view_count' in share) {
      await supabase
        .from('sharespeare')
        .update({ view_count: (share.view_count || 0) + 1 })
        .eq('id', id)
    }
    
    // 格式化返回数据
    const responseData = {
      ...share,
      author_name: share.author?.display_name || '匿名用户'
    }
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}