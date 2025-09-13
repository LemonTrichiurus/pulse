import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser, checkPermission } from '@/lib/security'

interface RouteParams {
  params: { id: string }
}

// 与前端编辑表单一致的校验
const calendarEventUpdateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  description: z.string().optional(),
  // YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确'),
  // 前端两种类型：EXAM 或 EVENT（EVENT 持久化为 ACTIVITY）
  type: z.enum(['EXAM', 'EVENT']),
  source: z.enum(['AP', 'UCLA', 'OTHER']).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional()
})

// GET /api/calendar/[id] - 获取单个日历事件
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: '事件ID不能为空' }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: '事件不存在' }, { status: 404 })
      }
      console.error('获取事件失败:', error)
      return NextResponse.json({ error: '获取事件失败' }, { status: 500 })
    }

    // 映射为前端期望的字段
    const responseData = {
      ...event,
      date: event.start_date,
      type: event.type === 'ACTIVITY' ? 'EVENT' : event.type,
      source: (event as any).source ?? 'OTHER',
      visibility: (event as any).visibility ?? 'PUBLIC'
    }

    return NextResponse.json({ data: responseData })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// PUT /api/calendar/[id] - 更新日历事件
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 权限：仅 ADMIN 或 MOD 可编辑
    const { hasPermission } = await checkPermission(user.id, ['ADMIN', 'MOD'])
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: '事件ID不能为空' }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // 先确认事件存在
    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if ((fetchError as any).code === 'PGRST116') {
        return NextResponse.json({ error: '事件不存在' }, { status: 404 })
      }
      console.error('获取事件失败:', fetchError)
      return NextResponse.json({ error: '获取事件失败' }, { status: 500 })
    }

    const raw = await request.json()
    const validated = calendarEventUpdateSchema.parse(raw)

    const mappedType = validated.type === 'EVENT' ? 'ACTIVITY' : validated.type
    const startDate = new Date(`${validated.date}T00:00:00.000Z`).toISOString()

    const updateData = {
      title: validated.title,
      description: validated.description ?? null,
      start_date: startDate,
      end_date: startDate,
      type: mappedType
    }

    const { data: updated, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('更新事件失败:', error)
      return NextResponse.json({ error: '更新事件失败' }, { status: 500 })
    }

    const responseData = {
      ...updated,
      date: updated.start_date,
      type: validated.type
    }

    return NextResponse.json({ data: responseData })
  } catch (error) {
    console.error('API错误:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据无效', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}