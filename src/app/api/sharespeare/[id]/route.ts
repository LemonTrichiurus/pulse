import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

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