import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const supabaseAdmin = createSupabaseAdmin()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    const { display_name, avatar_url } = await request.json()
    
    // 使用管理员客户端执行数据库操作，绕过RLS
    // 首先尝试插入用户资料（如果不存在）
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        display_name: display_name || null,
        avatar_url: avatar_url || null,
        role: 'MEMBER'
      })
    
    // 如果插入失败（可能是因为记录已存在），则尝试更新
    if (insertError) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          display_name: display_name || null,
          avatar_url: avatar_url || null
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('更新用户资料失败:', updateError)
        return NextResponse.json(
          { error: '更新用户资料失败' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}