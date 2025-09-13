'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { saveNewsDraft, submitNews } from './actions'
import { createClient } from '@/lib/supabase/client'

interface NewsFormData {
  id?: number
  title: string
  content_rich: string
  category: string
}

const categories = [
  { value: 'campus', label: '校园新闻' },
  { value: 'global', label: '国际新闻' }
]

function SubmitNewsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content_rich: '',
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 检查用户登录状态
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Client session:', session)
      if (!session) {
        toast.error('请先登录')
        router.push('/login?redirect=/submit/news')
        return
      }
      setUser(session.user)
    }
    checkUser()
  }, [router])

  // 如果是编辑模式，加载现有数据
  useEffect(() => {
    if (editId) {
      // TODO: 加载现有新闻数据
      // 这里可以添加一个获取新闻详情的函数
    }
  }, [editId])

  const handleInputChange = (field: keyof NewsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入标题')
      return
    }
    if (!formData.content_rich.trim()) {
      toast.error('请输入内容')
      return
    }
    if (!formData.category) {
      toast.error('请选择分类')
      return
    }

    setSaving(true)
    try {
      const result = await saveNewsDraft({
        id: formData.id,
        title: formData.title,
        content_rich: formData.content_rich,
        category: formData.category as 'campus' | 'global' | 'ai'
      })

      if (result.success) {
        toast.success(result.message)
        if (!formData.id && result.id) {
          // 新建草稿成功，更新URL为编辑模式
          setFormData(prev => ({ ...prev, id: result.id }))
          router.replace(`/submit/news?edit=${result.id}`)
        }
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.id) {
      // 如果还没有保存过，先保存草稿
      await handleSaveDraft()
      if (!formData.id) return
    }

    setLoading(true)
    try {
      const result = await submitNews(formData.id)
      if (result.success) {
        toast.success(result.message)
        router.push('/me/submissions')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <Button 
              onClick={() => router.back()} 
              variant="ghost" 
              className="gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {editId ? '编辑新闻' : '投稿新闻'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {editId ? '修改您的新闻内容' : '分享校园新闻，传递有价值的信息'}
            </p>
          </div>

          {/* 表单 */}
          <Card>
            <CardHeader>
              <CardTitle>新闻信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="请输入新闻标题"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={200}
                />
                <p className="text-sm text-gray-500">
                  {formData.title.length}/200 字符
                </p>
              </div>

              {/* 分类 */}
              <div className="space-y-2">
                <Label htmlFor="category">分类 *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择新闻分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 内容 */}
              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="请输入新闻内容，支持HTML格式"
                  value={formData.content_rich}
                  onChange={(e) => handleInputChange('content_rich', e.target.value)}
                  rows={15}
                  className="min-h-[400px]"
                />
                <p className="text-sm text-gray-500">
                  支持HTML格式，可以使用基本的HTML标签来格式化内容
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-6">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={saving || loading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存草稿'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || loading || !formData.title || !formData.content_rich || !formData.category}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? '提交中...' : '提交审核'}
                </Button>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>• 保存草稿：将内容保存为草稿状态，可以随时修改</p>
                <p>• 提交审核：提交给管理员审核，审核通过后将公开发布</p>
                <p>• 提交后无法修改，如被拒绝可返工重新编辑</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SubmitNewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitNewsForm />
    </Suspense>
  )
}