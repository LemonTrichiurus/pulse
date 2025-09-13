import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Redis 实例（可选）
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (error) {
  console.warn('Redis not available, using in-memory rate limiting')
}

// 内存存储后备方案
const memoryStore = new Map<string, { count: number; resetTime: number }>()

// 不同类型的速率限制配置
export const rateLimits = {
  // 严格限制 - 用于敏感操作（登录、注册、密码重置）
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 15分钟内最多5次
    analytics: true,
  }),
  
  // 中等限制 - 用于写操作（创建、更新、删除）
  moderate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 1分钟内最多20次
    analytics: true,
  }),
  
  // 宽松限制 - 用于读操作（获取数据）
  lenient: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 1分钟内最多100次
    analytics: true,
  }),
  
  // 管理员限制 - 用于管理员操作
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'), // 1分钟内最多50次
    analytics: true,
  }),
}

// 获取客户端标识符
export function getClientIdentifier(request: NextRequest): string {
  // 优先使用用户ID（如果已认证）
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }
  
  // 使用IP地址作为后备
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `ip:${ip}`
}

// 速率限制中间件
export async function rateLimit(
  request: NextRequest,
  limitType: keyof typeof rateLimits = 'lenient'
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const identifier = getClientIdentifier(request)
  const ratelimit = rateLimits[limitType]
  
  try {
    const result = await ratelimit.limit(identifier)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    }
  } catch (error) {
    console.warn('Rate limit service unavailable, using fallback')
    
    // 使用内存存储后备方案
    const key = `${limitType}:${identifier}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1分钟窗口
    const limits = { strict: 5, moderate: 20, lenient: 100, admin: 50 }
    const maxRequests = limits[limitType] || 100
    
    const stored = memoryStore.get(key)
    
    if (stored && stored.resetTime > now) {
      if (stored.count >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: new Date(stored.resetTime)
        }
      }
      
      stored.count++
      memoryStore.set(key, stored)
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - stored.count,
        reset: new Date(stored.resetTime)
      }
    } else {
      // 新的时间窗口
      const resetTime = now + windowMs
      memoryStore.set(key, { count: 1, resetTime })
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: new Date(resetTime)
      }
    }
  }
}

// 创建速率限制响应
export function createRateLimitResponse(result: {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}) {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.getTime().toString(),
  })
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          ...Object.fromEntries(headers.entries()),
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  return { headers }
}

// 路由速率限制映射
export const routeRateLimits: Record<string, keyof typeof rateLimits> = {
  // 认证相关 - 严格限制
  '/api/auth/signin': 'strict',
  '/api/auth/signup': 'strict',
  '/api/auth/reset-password': 'strict',
  
  // 写操作 - 中等限制
  '/api/news': 'moderate',
  '/api/topics': 'moderate',
  '/api/comments': 'moderate',
  '/api/sharespeare': 'moderate',
  '/api/calendar': 'moderate',
  
  // 管理员操作 - 管理员限制
  '/api/admin': 'admin',
  
  // 其他读操作 - 宽松限制（默认）
}

// 获取路由的速率限制类型
export function getRateLimitType(pathname: string): keyof typeof rateLimits {
  // 精确匹配
  if (routeRateLimits[pathname]) {
    return routeRateLimits[pathname]
  }
  
  // 前缀匹配
  for (const [route, limitType] of Object.entries(routeRateLimits)) {
    if (pathname.startsWith(route)) {
      return limitType
    }
  }
  
  // 默认使用宽松限制
  return 'lenient'
}