'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { getCurrentUser, isAdminOrMod, supabase } from '@/lib/supabase'

interface NewsForm {
  title: string
  content_rich: string
  cover_url: string
  category: 'CAMPUS' | 'GLOBAL'
  status: 'DRAFT' | 'PUBLISHED'
  top_rank?: number | null
}

export default function CreateNewsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<NewsForm>({
    title: '',
    content_rich: '',
    cover_url: '',
    category: 'CAMPUS',
    status: 'DRAFT',
    top_rank: null
  })

  useEffect(() => {
    checkPermissions()
  }, [])

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
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof NewsForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB')
      return
    }

    setUploading(true)
    try {
      // 获取会话以附带认证头
      const { data: sessionData } = await supabase!.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        toast.error('登录状态已失效，请重新登录后再试')
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const url = data?.data?.file?.url
        if (!url) throw new Error('无效的上传响应')
        handleInputChange('cover_url', url)
        toast.success('图片上传成功')
      } else {
        const error = await response.json()
        toast.error(error.error || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!form.title.trim()) {
      toast.error('请输入新闻标题')
      return
    }

    if (!form.content_rich.trim()) {
      toast.error('请输入新闻内容')
      return
    }

    setSaving(true)
    try {
      // 获取 Supabase 会话以附带认证头
      const { data: sessionData } = await supabase!.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        toast.error('登录状态已失效，请重新登录后再试')
        setSaving(false)
        return
      }

      // 将表单字段映射为后端 API 所需字段
      const submitData = {
        title: form.title,
        content: form.content_rich,
        featured_image: form.cover_url,
        category: form.category,
        status: isDraft ? 'DRAFT' : 'PUBLISHED',
        top_rank: form.top_rank ?? null
      }

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast.success(isDraft ? '草稿保存成功' : '新闻发布成功')
        router.push('/admin/news')
      } else {
        const error = await response.json()
        toast.error(error.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const removeCoverImage = () => {
    handleInputChange('cover_url', '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin/news')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回新闻管理
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">创建新闻</h1>
            <p className="text-muted-foreground">
              发布校园或全球新闻内容
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button 
            onClick={() => handleSubmit(false)}
            disabled={saving}
          >
            <Eye className="h-4 w-4 mr-2" />
            发布新闻
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写新闻的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="输入新闻标题..."
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              {/* 置顶权重（数字越大越靠前） */}
              <div className="space-y-2">
                <Label htmlFor="top_rank">置顶权重（可选）</Label>
                <Input
                  id="top_rank"
                  type="number"
                  inputMode="numeric"
                  placeholder="例如：100（数字越大越靠前）"
                  value={form.top_rank ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') return handleInputChange('top_rank', null as any)
                    const n = Number.parseInt(v, 10)
                    if (Number.isNaN(n)) return
                    handleInputChange('top_rank', n as any)
                  }}
                />
                <p className="text-sm text-muted-foreground">仅管理员或版主可生效，其他角色填写将被忽略</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类 *</Label>
                <Select value={form.category} onValueChange={(value: 'CAMPUS' | 'GLOBAL') => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择新闻分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMPUS">校园新闻</SelectItem>
                    <SelectItem value="GLOBAL">全球新闻</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 封面图片 */}
          <Card>
            <CardHeader>
              <CardTitle>封面图片</CardTitle>
              <CardDescription>上传新闻封面图片（可选）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.cover_url ? (
                <div className="relative">
                  <img 
                    src={form.cover_url} 
                    alt="封面预览" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeCoverImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">点击上传封面图片</p>
                    <p className="text-xs text-muted-foreground">支持 JPG、PNG 格式，最大 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>
              )}
              {uploading && (
                <div className="text-center text-sm text-muted-foreground">
                  上传中...
                </div>
              )}
            </CardContent>
          </Card>

          {/* 内容编辑 */}
          <Card>
            <CardHeader>
              <CardTitle>新闻内容</CardTitle>
              <CardDescription>编写新闻的详细内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="输入新闻内容..."
                  value={form.content_rich}
                  onChange={(e) => handleInputChange('content_rich', e.target.value)}
                  rows={15}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  支持 HTML 标签，如 &lt;p&gt;、&lt;strong&gt;、&lt;em&gt;、&lt;a&gt; 等
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 发布设置 */}
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>当前状态</Label>
                <div className="text-sm text-muted-foreground">
                  {form.status === 'DRAFT' ? '草稿' : '已发布'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>分类</Label>
                <div className="text-sm text-muted-foreground">
                  {form.category === 'CAMPUS' ? '校园新闻' : '全球新闻'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>作者</Label>
                <div className="text-sm text-muted-foreground">
                  {user?.display_name || user?.email}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 预览 */}
          <Card>
            <CardHeader>
              <CardTitle>预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.cover_url && (
                <img 
                  src={form.cover_url} 
                  alt="封面" 
                  className="w-full h-32 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  {form.title || '新闻标题'}
                </h3>
                <div className="text-xs text-muted-foreground line-clamp-4">
                  {form.content_rich.replace(/<[^>]*>/g, '') || '新闻内容预览...'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {saving ? '发布中...' : '发布新闻'}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存草稿
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}