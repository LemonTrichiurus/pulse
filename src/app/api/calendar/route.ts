import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getCurrentUser, checkPermission } from '@/lib/security'

// 创建/更新日历事件的验证模式（对齐前端表单字段）
const calendarEventCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  description: z.string().optional(),
  // 前端为 <input type="date"/>，为 YYYY-MM-DD 格式
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确'),
  // 前端只区分 EXAM 与 EVENT，EVENT 将映射为 ACTIVITY 存储
  type: z.enum(['EXAM', 'EVENT']),
  // 可选字段，当前表模型未存储，先接受用于前端兼容
  source: z.enum(['AP', 'UCLA', 'OTHER']).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional()
})

// 查询参数验证模式
const calendarQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  // 按表字段 type 进行筛选，支持现有管理页使用到的值
  type: z.enum(['ACADEMIC', 'EXAM', 'HOLIDAY', 'ACTIVITY']).optional(),
  search: z.string().optional()
})

// GET /api/calendar - 获取日历事件列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    const queryParams = calendarQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined
    })
    
    const page = parseInt(queryParams.page)
    const limit = Math.min(parseInt(queryParams.limit), 100)
    const offset = (page - 1) * limit
    
    // 构建查询
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        profiles:profiles!calendar_events_created_by_fkey (
          id,
          display_name
        )
      `, { count: 'exact' })
    
    // 应用筛选条件
    if (queryParams.start_date) {
      query = query.gte('start_date', queryParams.start_date)
    }
    
    if (queryParams.end_date) {
      query = query.lte('end_date', queryParams.end_date)
    }
    
    if (queryParams.type) {
      query = query.eq('type', queryParams.type)
    }
    
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`)
    }
    
    // 排序和分页
    query = query
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('获取日历事件失败:', error)
      return NextResponse.json(
        { error: '获取日历事件失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data,
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

// POST /api/calendar - 创建新的日历事件（对齐前端字段并映射存储）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }
    
    // 检查用户权限（只有管理员和版主可以创建日历事件）
    const { hasPermission } = await checkPermission(user.id, ['ADMIN', 'MOD'])
    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
 
    const supabase = await createSupabaseServer()
    const body = await request.json()
    const validated = calendarEventCreateSchema.parse(body)

    // 字段映射：EVENT -> ACTIVITY，其余保持
    const mappedType = validated.type === 'EVENT' ? 'ACTIVITY' : validated.type
    // 将 YYYY-MM-DD 转换为 ISO 起始时间
    const startDate = new Date(`${validated.date}T00:00:00.000Z`).toISOString()
    
    const insertData = {
      title: validated.title,
      description: validated.description || null,
      start_date: startDate,
      end_date: startDate,
      type: mappedType,
      created_by: user.id
    }
    
    const { data: calendarEvent, error } = await supabase
      .from('calendar_events')
      .insert(insertData)
      .select('*')
      .single()
    
    if (error) {
      console.error('创建日历事件失败:', error)
      return NextResponse.json(
        { error: '创建日历事件失败' },
        { status: 500 }
      )
    }

    // 返回创建结果，补充前端期望字段名
    return NextResponse.json({
      data: {
        ...calendarEvent,
        date: calendarEvent.start_date,
        type: validated.type // 回显前端选择的值
      }
    })
    
  } catch (error) {
    console.error('创建日历事件失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据无效', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}