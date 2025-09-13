'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  GraduationCap,
  School,
  Building,
  Globe,
  Lock,
  Loader2
} from 'lucide-react'
import { getCurrentUser, isAdminOrMod, supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'EXAM' | 'EVENT'
  source: 'AP' | 'UCLA' | 'OTHER'
  description?: string
  visibility: 'PUBLIC' | 'PRIVATE'
  created_by: {
    id: string
    display_name: string
  }
  created_at: string
}

interface EventFormData {
  title: string
  date: string
  type: 'EXAM' | 'EVENT' | ''
  source: 'AP' | 'UCLA' | 'OTHER' | ''
  description: string
  visibility: 'PUBLIC' | 'PRIVATE' | ''
}

export default function EditCalendarEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    type: '',
    source: '',
    description: '',
    visibility: ''
  })
  const [errors, setErrors] = useState<Partial<EventFormData>>({})

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    if (user && eventId) {
      loadEvent()
    }
  }, [user, eventId])

  const checkPermissions = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      const permission = await isAdminOrMod(currentUser.id)
      if (!permission) {
        router.push('/')
        return
      }

      setUser(currentUser)
    } catch (error) {
      console.error('权限检查失败:', error)
      router.push('/')
    }
  }

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/calendar/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        const eventData = data.data
        setEvent(eventData)
        
        // 填充表单数据
        setFormData({
          title: eventData.title,
          date: eventData.date.split('T')[0], // 只取日期部分
          type: eventData.type,
          source: eventData.source,
          description: eventData.description || '',
          visibility: eventData.visibility
        })
      } else if (response.status === 404) {
        toast.error('事件不存在')
        router.push('/admin/calendar')
      } else {
        toast.error('加载事件失败')
        router.push('/admin/calendar')
      }
    } catch (error) {
      console.error('加载事件失败:', error)
      toast.error('加载事件失败')
      router.push('/admin/calendar')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入事件标题'
    }

    if (!formData.date) {
      newErrors.date = '请选择事件日期'
    }

    if (!formData.type) {
      newErrors.type = '请选择事件类型'
    }

    if (!formData.source) {
      newErrors.source = '请选择事件来源'
    }

    if (!formData.visibility) {
      newErrors.visibility = '请选择可见性'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('请填写所有必填字段')
      return
    }

    setSaving(true)
    try {
      // 获取认证令牌
      const { data: sessionData } = await supabase!.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        toast.error('登录状态已失效，请重新登录后再试')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          date: formData.date,
          type: formData.type,
          source: formData.source,
          description: formData.description.trim() || undefined,
          visibility: formData.visibility
        })
      })

      if (response.ok) {
        toast.success('日历事件更新成功')
        router.push('/admin/calendar')
      } else {
        const error = await response.json()
        toast.error(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXAM':
        return <GraduationCap className="h-4 w-4" />
      case 'EVENT':
        return <CalendarIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'AP':
        return <School className="h-4 w-4" />
      case 'UCLA':
        return <Building className="h-4 w-4" />
      default:
        return null
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4" />
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">事件不存在</h2>
          <Button onClick={() => router.push('/admin/calendar')}>
            返回日历管理
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/admin/calendar')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回日历管理
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑日历事件</h1>
          <p className="text-muted-foreground">
            修改事件信息
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>
              修改事件的基本信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 事件标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">事件标题 *</Label>
              <Input
                id="title"
                placeholder="输入事件标题"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 事件日期 */}
            <div className="space-y-2">
              <Label htmlFor="date">事件日期 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* 事件类型 */}
            <div className="space-y-2">
              <Label>事件类型 *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择事件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXAM">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-red-500" />
                      考试
                    </div>
                  </SelectItem>
                  <SelectItem value="EVENT">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                      活动
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            {/* 事件来源 */}
            <div className="space-y-2">
              <Label>事件来源 *</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => handleInputChange('source', value)}
              >
                <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择事件来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AP">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-purple-500" />
                      AP 课程
                    </div>
                  </SelectItem>
                  <SelectItem value="UCLA">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-500" />
                      UCLA 项目
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER">
                    <div className="flex items-center gap-2">
                      其他
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-sm text-red-500">{errors.source}</p>
              )}
            </div>

            {/* 可见性 */}
            <div className="space-y-2">
              <Label>可见性 *</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(value) => handleInputChange('visibility', value)}
              >
                <SelectTrigger className={errors.visibility ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择可见性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      公开 - 所有人可见
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-500" />
                      私有 - 仅管理员可见
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.visibility && (
                <p className="text-sm text-red-500">{errors.visibility}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>详细描述</CardTitle>
            <CardDescription>
              修改事件的详细描述（可选）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">事件描述</Label>
              <Textarea
                id="description"
                placeholder="输入事件的详细描述..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* 预览卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>预览</CardTitle>
            <CardDescription>
              事件更新后的显示效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {formData.type && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    {getTypeIcon(formData.type)}
                    {formData.type === 'EXAM' ? '考试' : '活动'}
                  </div>
                )}
                {formData.source && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    {getSourceIcon(formData.source)}
                    {formData.source === 'AP' ? 'AP' : formData.source === 'UCLA' ? 'UCLA' : '其他'}
                  </div>
                )}
                {formData.visibility && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    {getVisibilityIcon(formData.visibility)}
                    {formData.visibility === 'PUBLIC' ? '公开' : '私有'}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold">
                {formData.title || '事件标题'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {formData.date ? new Date(formData.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                }) : '选择日期'}
              </div>
              {formData.description && (
                <p className="text-sm text-muted-foreground">
                  {formData.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/admin/calendar')}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>
    </div>
  )
}