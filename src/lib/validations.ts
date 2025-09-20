import { z } from 'zod'

// 用户相关验证
export const userRoleSchema = z.enum(['ADMIN', 'MOD', 'MEMBER'])

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  displayName: z.string().min(1, '请输入显示名称').max(50, '显示名称不能超过50个字符')
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
})

// 新闻相关验证
export const newsCategorySchema = z.enum(['CAMPUS', 'GLOBAL'])
export const newsStatusSchema = z.enum(['DRAFT', 'PUBLISHED'])

export const createNewsSchema = z.object({
  title: z.string().min(1, '请输入新闻标题').max(200, '标题不能超过200个字符'),
  content_rich: z.string().min(1, '请输入新闻内容'),
  cover_url: z.string().url('请输入有效的封面图片URL').optional(),
  category: newsCategorySchema,
  status: newsStatusSchema.optional().default('DRAFT'),
  published_at: z.string().datetime().optional()
})

export const updateNewsSchema = createNewsSchema.partial()

// Sharespeare 相关验证
export const createSharespeareSchema = z.object({
  title: z.string().min(1, '请输入标题').max(200, '标题不能超过200个字符'),
  content_rich: z.string().min(1, '请输入内容'),
  media_url: z.string().url('请输入有效的媒体URL').optional(),
  media_urls: z.array(z.string().url('请输入有效的媒体URL')).max(10, '最多只能上传10张图片').optional(),
  status: newsStatusSchema.optional().default('DRAFT'),
  published_at: z.string().datetime().optional()
})

export const updateSharespeareSchema = createSharespeareSchema.partial()

// 话题相关验证
export const topicStatusSchema = z.enum(['OPEN', 'LOCKED'])

export const createTopicSchema = z.object({
  title: z.string().min(1, '请输入话题标题').max(200, '标题不能超过200个字符'),
  body_rich: z.string().min(1, '请输入话题内容'),
  status: topicStatusSchema.optional().default('OPEN')
})

export const updateTopicSchema = z.object({
  title: z.string().min(1, '请输入话题标题').max(200, '标题不能超过200个字符').optional(),
  body_rich: z.string().min(1, '请输入话题内容').optional(),
  status: topicStatusSchema.optional()
})

// 评论相关验证
export const commentStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const createCommentSchema = z.object({
  topic_id: z.string().uuid('请输入有效的话题ID'),
  body_rich: z.string().min(1, '请输入评论内容').max(2000, '评论内容不能超过2000个字符')
})

export const moderateCommentSchema = z.object({
  commentId: z.string().uuid('请输入有效的评论ID'),
  action: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().max(500, '原因不能超过500个字符').optional()
})

export const batchModerateCommentsSchema = z.object({
  commentIds: z.array(z.string().uuid()).min(1, '请选择至少一个评论'),
  action: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().max(500, '原因不能超过500个字符').optional()
})

// 日历事件相关验证
export const calendarEventTypeSchema = z.enum(['EXAM', 'EVENT'])
export const calendarEventSourceSchema = z.enum(['AP', 'UCLA', 'OTHER'])
export const calendarEventVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE'])

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, '请输入事件标题').max(200, '标题不能超过200个字符'),
  date: z.string().datetime('请输入有效的日期时间'),
  type: calendarEventTypeSchema,
  source: calendarEventSourceSchema,
  description: z.string().max(1000, '描述不能超过1000个字符').optional(),
  visibility: calendarEventVisibilitySchema
})

export const updateCalendarEventSchema = createCalendarEventSchema.partial()

// 标签相关验证
export const createTagSchema = z.object({
  name: z.string().min(1, '请输入标签名称').max(50, '标签名称不能超过50个字符')
})

// 文件上传验证
export const uploadFileSchema = z.object({
  file: z.any().refine((file) => {
    if (!file) return false
    if (!(file instanceof File)) return false
    
    // 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) return false
    
    // 检查文件类型
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
    
    return allowedTypes.includes(file.type)
  }, '请上传有效的文件（图片、视频、PDF或文本文件，最大5MB）')
})

// 查询参数验证
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  author: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'published_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// 新闻查询验证
export const newsQuerySchema = paginationSchema.merge(
  searchSchema.extend({
    category: newsCategorySchema.optional(),
    status: newsStatusSchema.optional()
  })
)

// 话题查询验证
export const topicsQuerySchema = paginationSchema.merge(
  searchSchema.extend({
    status: topicStatusSchema.optional()
  })
)

// 评论查询验证
export const commentsQuerySchema = paginationSchema.merge(
  searchSchema.extend({
    status: commentStatusSchema.optional(),
    topic_id: z.string().uuid().optional()
  })
)

// 日历事件查询验证
export const calendarQuerySchema = paginationSchema.merge(
  searchSchema.extend({
    type: calendarEventTypeSchema.optional(),
    source: calendarEventSourceSchema.optional(),
    visibility: calendarEventVisibilitySchema.optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional()
  })
)

// Sharespeare 查询验证
export const sharespeareQuerySchema = paginationSchema.merge(
  searchSchema.extend({
    status: newsStatusSchema.optional()
  })
)

// 审计日志验证
export const auditLogSchema = z.object({
  actor_id: z.string().uuid(),
  action: z.string().min(1).max(100),
  entity: z.string().min(1).max(50),
  entity_id: z.string().uuid().optional(),
  meta: z.record(z.any()).optional()
})

// 通用响应验证
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }).optional()
})

// 错误响应验证
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  code: z.string().optional()
})

// 验证辅助函数
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  error?: string
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: '验证失败' }
  }
}

// 安全验证辅助函数
export function sanitizeHtml(html: string): string {
  // 基础的 HTML 清理，生产环境建议使用 DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// 文件名安全化
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100)
}

// URL 验证
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 邮箱验证
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// UUID 验证
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}