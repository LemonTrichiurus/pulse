import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  rateLimit,
  createRateLimitResponse,
  getRateLimitType
} from './lib/rate-limit'
import { createServerClient } from '@supabase/ssr'

// 速率限制配置
const RATE_LIMIT_CONFIG = {
  // API 路由限制
  '/api/': { maxRequests: 60, windowMs: 60000 }, // 每分钟60次
  '/api/auth/': { maxRequests: 10, windowMs: 60000 }, // 认证接口更严格
  '/api/comments': { maxRequests: 20, windowMs: 60000 }, // 评论接口限制
  '/api/topics': { maxRequests: 30, windowMs: 60000 }, // 话题接口限制
  '/api/upload': { maxRequests: 10, windowMs: 60000 }, // 文件上传限制
  
  // 管理后台限制
  '/admin': { maxRequests: 100, windowMs: 60000 }
}



// 辅助函数

// 检查路由权限
function checkRoutePermission(pathname: string, userRole?: string): boolean {
  // 管理后台路由权限
  if (pathname.startsWith('/admin')) {
    return userRole === 'ADMIN' || userRole === 'MODERATOR'
  }
  
  // API 路由权限检查
  if (pathname.startsWith('/api/')) {
    // 公开 API 路由（GET 请求）
    const publicGetRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/news',
      '/api/sharespeare', 
      '/api/calendar',
      '/api/topics'
    ]
    
    // 需要认证的 API 路由
    const authRequiredRoutes = [
      '/api/comments',
      '/api/upload',
      '/api/user'
    ]
    
    // 需要管理员权限的 API 路由
    const adminRequiredRoutes = [
      '/api/admin/',
      '/api/moderate'
    ]
    
    // 检查管理员权限
    for (const route of adminRequiredRoutes) {
      if (pathname.startsWith(route)) {
        return userRole === 'ADMIN' || userRole === 'MODERATOR'
      }
    }
    
    // 检查认证要求
    for (const route of authRequiredRoutes) {
      if (pathname.startsWith(route)) {
        return !!userRole
      }
    }
    
    // 检查公开路由
    for (const route of publicGetRoutes) {
      if (pathname.startsWith(route)) {
        return true
      }
    }
    
    // 默认需要认证
    return !!userRole
  }
  
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  console.log(`Middleware: ${request.method} ${pathname} from IP ${clientIP}`)
  
  // 跳过静态文件和 Next.js 内部路由
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    // 刷新 Supabase 会话（这是关键！）
    let supabaseResponse = NextResponse.next({
      request,
    })
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 这行会在需要时刷新会话，并通过 setAll 写回 cookie
    await supabase.auth.getUser()
    // 1. 速率限制检查（仅对API路由）
    if (pathname.startsWith('/api/')) {
      const limitType = getRateLimitType(pathname)
      const rateLimitResult = await rateLimit(request, limitType)
      
      if (!rateLimitResult.success) {
        console.log(`Rate limit exceeded for ${clientIP}: ${pathname}`)
        return createRateLimitResponse(rateLimitResult)
      }
      
      // 添加速率限制信息到响应头
      supabaseResponse.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      supabaseResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      supabaseResponse.headers.set('X-RateLimit-Reset', rateLimitResult.reset.getTime().toString())
      
      return supabaseResponse
    }

    // 2. 页面路由的权限检查
    if (pathname.startsWith('/admin')) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        // 检查用户角色
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'MODERATOR')) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } catch (error) {
        console.error('Auth check error:', error)
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    
    return supabaseResponse
    
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api/health (健康检查)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}