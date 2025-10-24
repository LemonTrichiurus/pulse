import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, color')
      .order('name', { ascending: true })

    if (error) {
      console.error('获取标签失败:', error)
      return NextResponse.json({ error: '获取标签失败' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (e) {
    console.error('服务器错误:', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}