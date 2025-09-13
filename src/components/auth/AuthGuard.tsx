'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/Authcontext'
import { UserRole } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackUrl?: string
}

export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  fallbackUrl = '/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // 如果用户未登录，重定向到登录页
      if (!user) {
        const currentPath = window.location.pathname
        const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
        return
      }

      // 如果需要特定角色权限，检查用户角色
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.push('/403') // 权限不足页面
        return
      }
    }
  }, [user, loading, router, requiredRoles, fallbackUrl])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录或权限不足，不渲染内容
  if (!user || (requiredRoles.length > 0 && !requiredRoles.includes(user.role))) {
    return null
  }

  return <>{children}</>
}

// 管理员权限保护组件
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={['ADMIN', 'MOD']}>
      {children}
    </AuthGuard>
  )
}

// 仅管理员权限保护组件
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={['ADMIN']}>
      {children}
    </AuthGuard>
  )
}