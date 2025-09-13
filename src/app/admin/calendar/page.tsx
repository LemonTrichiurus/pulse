'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  ArrowLeft,
  Calendar as CalendarIcon,
  User,
  Clock,
  Globe,
  Lock,
  GraduationCap,
  School,
  Building
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/Authcontext'
import { AdminGuard } from '@/components/auth/AuthGuard'
import { toast } from 'sonner'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  type: 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'ACTIVITY'
  profiles: {
    id: string
    display_name: string
  }
  created_at: string
}

function CalendarManagementContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, typeFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          profiles (
            id,
            display_name
          )
        `)
        .order('start_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('加载日历事件失败:', error)
      toast.error('加载日历事件失败')
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // 类型筛选
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(event => event.type === typeFilter)
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 按日期排序
    filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

    setFilteredEvents(filtered)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventToDelete)

      if (error) throw error

      toast.success('日历事件删除成功')
      await loadEvents()
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteDialogOpen(true)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'EXAM':
        return <Badge variant="outline" className="text-red-600 border-red-600"><GraduationCap className="h-3 w-3 mr-1" />考试</Badge>
      case 'ACADEMIC':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><School className="h-3 w-3 mr-1" />学术</Badge>
      case 'HOLIDAY':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CalendarIcon className="h-3 w-3 mr-1" />假期</Badge>
      case 'ACTIVITY':
        return <Badge variant="outline" className="text-purple-600 border-purple-600"><CalendarIcon className="h-3 w-3 mr-1" />活动</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const examCount = events.filter(e => e.type === 'EXAM').length
  const academicCount = events.filter(e => e.type === 'ACADEMIC').length
  const holidayCount = events.filter(e => e.type === 'HOLIDAY').length
  const activityCount = events.filter(e => e.type === 'ACTIVITY').length
  const upcomingCount = events.filter(e => isUpcoming(e.start_date)).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回管理后台
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">日历管理</h1>
            <p className="text-muted-foreground">
              管理校园考试和活动日程
            </p>
          </div>
        </div>
        <Link href="/admin/calendar/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建事件
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">考试</CardTitle>
            <GraduationCap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{examCount}</div>
            <p className="text-xs text-muted-foreground">考试安排</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学术</CardTitle>
            <School className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{academicCount}</div>
            <p className="text-xs text-muted-foreground">学术事件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">假期</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{holidayCount}</div>
            <p className="text-xs text-muted-foreground">假期安排</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活动</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{activityCount}</div>
            <p className="text-xs text-muted-foreground">校园活动</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索事件标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                <SelectItem value="EXAM">考试</SelectItem>
                <SelectItem value="ACADEMIC">学术</SelectItem>
                <SelectItem value="HOLIDAY">假期</SelectItem>
                <SelectItem value="ACTIVITY">活动</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 事件列表 */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Card key={event.id} className={`${isPast(event.start_date) ? 'opacity-75' : ''} ${isUpcoming(event.start_date) && new Date(event.start_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'border-orange-200' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(event.type)}
                      {isPast(event.start_date) && (
                        <Badge variant="outline" className="text-gray-500 border-gray-500">已过期</Badge>
                      )}
                      {isUpcoming(event.start_date) && new Date(event.start_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">即将到来</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(event.start_date)}
                        {event.end_date && event.end_date !== event.start_date && (
                          <span> - {formatDate(event.end_date)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {event.profiles.display_name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/admin/calendar/${event.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(event.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {event.description}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">暂无事件</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'ALL'
                  ? '没有符合条件的事件' 
                  : '还没有创建任何日历事件'}
              </p>
              <Link href="/admin/calendar/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个事件
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个日历事件吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setEventToDelete(null)
              }}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CalendarManagementPage() {
  return (
    <AdminGuard>
      <CalendarManagementContent />
    </AdminGuard>
  )
}