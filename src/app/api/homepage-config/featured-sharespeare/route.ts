import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // 获取精选文章ID配置
    const { data: configData, error: configError } = await supabase
      .from('homepage_config')
      .select('config_value')
      .eq('config_key', 'featured_sharespeare_id')
      .single()

    if (configError || !configData?.config_value) {
      return NextResponse.json(
        { error: '未找到精选文章配置' },
        { status: 404 }
      )
    }

    // 根据ID获取文章详情
    const { data: articleData, error: articleError } = await supabase
      .from('sharespeare')
      .select(`
        id,
        title,
        content_rich,
        media_url,
        media_urls,
        published_at,
        created_at,
        status,
        author:profiles!sharespeare_author_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', configData.config_value)
      .eq('status', 'PUBLISHED')
      .single()

    if (articleError || !articleData) {
      return NextResponse.json(
        { error: '精选文章不存在或未发布' },
        { status: 404 }
      )
    }

    // 格式化返回数据
    const formattedData = {
      id: articleData.id,
      title: articleData.title,
      content_rich: articleData.content_rich,
      media_url: articleData.media_url,
      media_urls: articleData.media_urls,
      published_at: articleData.published_at,
      created_at: articleData.created_at,
      status: articleData.status,
      author: {
        id: articleData.author.id,
        display_name: articleData.author.display_name,
        avatar_url: articleData.author.avatar_url
      }
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('获取精选文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供有效的认证令牌' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // 使用客户端 supabase 验证用户身份
    const { data: { user }, error: authError } = await supabase!.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      )
    }

    // 检查用户权限（管理员或版主）
    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['ADMIN', 'MODERATOR'].includes(profile.role)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取请求数据
    const { sharespeare_id } = await request.json()

    if (!sharespeare_id) {
      return NextResponse.json(
        { error: '缺少文章ID' },
        { status: 400 }
      )
    }

    // 验证文章是否存在且已发布
    const { data: articleData, error: articleError } = await supabase!
      .from('sharespeare')
      .select('id, status')
      .eq('id', sharespeare_id)
      .eq('status', 'PUBLISHED')
      .single()

    if (articleError || !articleData) {
      return NextResponse.json(
        { error: '文章不存在或未发布' },
        { status: 404 }
      )
    }

    // 使用服务角色密钥更新配置
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '服务配置错误' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('homepage_config')
      .update({ 
        config_value: sharespeare_id,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', 'featured_sharespeare_id')

    if (updateError) {
      console.error('更新配置失败:', updateError)
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: '精选文章设置成功'
    })

  } catch (error) {
    console.error('设置精选文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}