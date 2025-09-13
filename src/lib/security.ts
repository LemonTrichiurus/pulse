import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auditLogSchema } from './validations'

// 创建 Supabase 服务端客户端
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 用户角色类型
export type UserRole = 'ADMIN' | 'MOD' | 'MEMBER'

// 权限检查函数
export async function checkPermission(
  userId: string,
  requiredRoles: UserRole[]
): Promise<{ hasPermission: boolean; userRole?: UserRole; error?: string }> {
  try {
    const supabase = createServiceClient()
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return { hasPermission: false, error: '用户不存在' }
    }
    
    const userRole = user.role as UserRole
    const hasPermission = requiredRoles.includes(userRole)
    
    return { hasPermission, userRole }
  } catch (error) {
    console.error('权限检查失败:', error)
    return { hasPermission: false, error: '权限检查失败' }
  }
}

// 从请求中获取用户信息
export async function getUserFromRequest(request: NextRequest): Promise<{
  user?: { id: string; email: string; role: UserRole }
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: '缺少认证令牌' }
    }
    
    const token = authHeader.substring(7)
    const supabase = createServiceClient()
    
    // 验证 JWT token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return { error: '无效的认证令牌' }
    }
    
    // 获取用户详细信息（从 profiles 表）
    const { data: userDetails, error: userError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', authUser.id)
      .single()
    
    if (userError || !userDetails) {
      return { error: '用户信息不存在' }
    }
    
    return {
      user: {
        id: userDetails.id,
        email: userDetails.email,
        role: userDetails.role as UserRole
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { error: '获取用户信息失败' }
  }
}

// 新增：统一导出的 getCurrentUser，满足各 API 直接调用
export async function getCurrentUser(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  return user || null
}

// 权限中间件包装器
export function withAuth(requiredRoles: UserRole[] = []) {
  return function (handler: (request: NextRequest, context: Record<string, unknown>) => Promise<NextResponse>) {
    return async function (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse> {
      try {
        const { user, error } = await getUserFromRequest(request)
        
        if (error || !user) {
          return NextResponse.json(
            { error: error || '认证失败' },
            { status: 401 }
          )
        }
        
        // 检查角色权限
        if (requiredRoles.length > 0) {
          const { hasPermission } = await checkPermission(user.id, requiredRoles)
          
          if (!hasPermission) {
            return NextResponse.json(
              { error: '权限不足' },
              { status: 403 }
            )
          }
        }
        
        // 将用户信息添加到请求中
        ;(request as NextRequest & { user: typeof user }).user = user
        
        return handler(request, context)
      } catch (error) {
        console.error('认证中间件错误:', error)
        return NextResponse.json(
          { error: '服务器内部错误' },
          { status: 500 }
        )
      }
    }
  }
}

// 审计日志记录
export async function createAuditLog({
  actorId,
  action,
  entity,
  entityId,
  meta
}: {
  actorId: string
  action: string
  entity: string
  entityId?: string
  meta?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = auditLogSchema.safeParse({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      meta
    })
    
    if (!validation.success) {
      return { success: false, error: '审计日志数据无效' }
    }
    
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert(validation.data)
    
    if (error) {
      console.error('创建审计日志失败:', error)
      return { success: false, error: '创建审计日志失败' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('审计日志记录错误:', error)
    return { success: false, error: '审计日志记录错误' }
  }
}

// 错误响应创建器
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// 成功响应创建器
export function createSuccessResponse(
  data?: Record<string, unknown> | unknown[],
  message?: string,
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination,
    timestamp: new Date().toISOString()
  })
}

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// 清理过期的速率限制记录
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// 速率限制检查
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupRateLimit()
  
  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // 创建新记录或重置过期记录
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime
    }
  }
  
  // 更新现有记录
  record.count++
  
  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime
  }
}

// IP 地址获取
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// 内容所有权检查
export async function checkContentOwnership(
  userId: string,
  entityType: 'news' | 'sharespeare' | 'topics' | 'comments',
  entityId: string
): Promise<{ isOwner: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    
    let query
    switch (entityType) {
      case 'news':
        query = supabase.from('news').select('author_id').eq('id', entityId)
        break
      case 'sharespeare':
        query = supabase.from('sharespeare').select('author_id').eq('id', entityId)
        break
      case 'topics':
        query = supabase.from('topics').select('author_id').eq('id', entityId)
        break
      case 'comments':
        query = supabase.from('comments').select('author_id').eq('id', entityId)
        break
      default:
        return { isOwner: false, error: '不支持的实体类型' }
    }
    
    const { data, error } = await query.single()
    
    if (error || !data) {
      return { isOwner: false, error: '内容不存在' }
    }
    
    return { isOwner: data.author_id === userId }
  } catch (error) {
    console.error('检查内容所有权失败:', error)
    return { isOwner: false, error: '检查内容所有权失败' }
  }
}

// 管理员邮箱检查
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(email)
}

// 安全头设置
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  return response
}

// 输入清理
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
}

// 密码强度检查
export function checkPasswordStrength(password: string): {
  isStrong: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('密码至少需要8个字符')
  }
  
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含小写字母')
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含大写字母')
  }
  
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含数字')
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含特殊字符')
  }
  
  return {
    isStrong: score >= 4,
    score,
    feedback
  }
}

// 文件类型检查
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain'
  ]
  
  return allowedTypes.includes(mimeType)
}

// 文件大小检查
export function isAllowedFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size <= maxSizeBytes
}