'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  Users, 
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  Star
} from 'lucide-react'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/Authcontext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalNews: number
  totalTopics: number
  pendingComments: number
  totalEvents: number
  totalUsers: number
  recentActivity: number
}

function AdminDashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const loadDashboardStats = async () => {
    try {
      const supabase = createClient()
      
      // 获取新闻统计
      const { count: newsCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
      
      // 获取话题统计
      const { count: topicsCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
      
      // 获取待审核评论统计
      const { count: pendingCommentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')
      
      // 获取日历事件统计
      const { count: eventsCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
      
      // 获取用户统计
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      setStats({
        totalNews: newsCount || 0,
        totalTopics: topicsCount || 0,
        pendingComments: pendingCommentsCount || 0,
        totalEvents: eventsCount || 0,
        totalUsers: usersCount || 0,
        recentActivity: 0
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }
  
  useEffect(() => {
    loadDashboardStats()
  }, [])



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理后台</h1>
          <p className="text-muted-foreground">
            欢迎回来，{user?.displayName || user?.email}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {user?.role || 'ADMIN'}
        </Badge>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">新闻文章</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNews}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% 本月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">讨论话题</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTopics}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% 本月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核评论</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pendingComments}</div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                需要处理
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">日历事件</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                本月活动
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用的管理功能快捷入口
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">内容管理</TabsTrigger>
              <TabsTrigger value="moderation">审核队列</TabsTrigger>
              <TabsTrigger value="calendar">日历管理</TabsTrigger>
              <TabsTrigger value="users">用户管理</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/news')}
                >
                  <FileText className="h-6 w-6" />
                  管理新闻
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/sharespeare')}
                >
                  <FileText className="h-6 w-6" />
                  管理Sharespeare
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/featured-sharespeare')}
                >
                  <Star className="h-6 w-6" />
                  管理精选Sharespeare
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/topics')}
                >
                  <MessageSquare className="h-6 w-6" />
                  管理话题
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/upload')}
                >
                  <FileText className="h-6 w-6" />
                  文件上传
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="moderation" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/review')}
                >
                  <Eye className="h-6 w-6 text-blue-500" />
                  投稿审核
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/comments/moderate')}
                >
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                  评论审核队列
                  {stats && stats.pendingComments > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.pendingComments}
                    </Badge>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/calendar')}
                >
                  <Calendar className="h-6 w-6" />
                  管理日历事件
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/calendar/new')}
                >
                  <Calendar className="h-6 w-6" />
                  创建新事件
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="h-6 w-6" />
                  用户管理
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/admin/audit-logs')}
                >
                  <FileText className="h-6 w-6" />
                  审计日志
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  )
}