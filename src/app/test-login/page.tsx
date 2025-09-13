'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/Authcontext'
import { toast } from 'sonner'

export default function TestLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn, user } = useAuth()

  const testAccounts = [
    { email: 'admin@school.edu', password: 'admin123', role: '管理员' },
    { email: 'moderator@school.edu', password: 'mod123', role: '版主' },
    { email: 'student1@school.edu', password: 'student123', role: '学生' }
  ]

  const handleTestLogin = async (email: string, password: string, role: string) => {
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success(`已使用${role}账号登录成功！`)
      router.push('/admin/topics')
    } catch (error: any) {
      console.error('登录失败:', error)
      toast.error(`登录失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>已登录</CardTitle>
            <CardDescription>
              当前用户: {user.displayName || user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/admin/topics')} 
              className="w-full"
            >
              前往话题管理
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>测试登录</CardTitle>
          <CardDescription>
            选择一个测试账号快速登录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testAccounts.map((account, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleTestLogin(account.email, account.password, account.role)}
              disabled={loading}
            >
              <div className="text-left">
                <div className="font-medium">{account.role}</div>
                <div className="text-sm text-muted-foreground">{account.email}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}