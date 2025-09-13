'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, Link } from 'lucide-react'
import { saveShareDraft, submitShare } from './actions'

interface ShareFormData {
  id?: number
  title: string
  content_rich: string
  media_url: string
}

function SubmitShareForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  
  const [formData, setFormData] = useState<ShareFormData>({
    title: '',
    content_rich: '',
    media_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 如果是编辑模式，加载现有数据
  useEffect(() => {
    if (editId) {
      // TODO: 加载现有分享数据
      // 这里可以添加一个获取分享详情的函数
    }
  }, [editId])

  const handleInputChange = (field: keyof ShareFormData, value: string) => {
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

    setSaving(true)
    try {
      const result = await saveShareDraft({
        id: formData.id,
        title: formData.title,
        content_rich: formData.content_rich,
        media_url: formData.media_url
      })

      if (result.success) {
        toast.success(result.message)
        if (!formData.id && result.id) {
          // 新建草稿成功，更新URL为编辑模式
          setFormData(prev => ({ ...prev, id: result.id }))
          router.replace(`/submit/share?edit=${result.id}`)
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
      const result = await submitShare(formData.id)
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
              {editId ? '编辑分享' : '投稿分享'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {editId ? '修改您的分享内容' : '分享您的经验和见解，帮助更多同学'}
            </p>
          </div>

          {/* 表单 */}
          <Card>
            <CardHeader>
              <CardTitle>分享信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="请输入分享标题"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={200}
                />
                <p className="text-sm text-gray-500">
                  {formData.title.length}/200 字符
                </p>
              </div>

              {/* 媒体链接 */}
              <div className="space-y-2">
                <Label htmlFor="media_url">
                  <Link className="w-4 h-4 inline mr-1" />
                  媒体链接（可选）
                </Label>
                <Input
                  id="media_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.media_url}
                  onChange={(e) => handleInputChange('media_url', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  可以添加图片、视频或其他媒体文件的链接
                </p>
              </div>

              {/* 内容 */}
              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  placeholder="请输入分享内容，支持HTML格式\n\n您可以分享：\n• 学习经验和方法\n• 生活感悟和思考\n• 技能技巧和心得\n• 有趣的发现和见解"
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
                  disabled={saving || loading || !formData.title || !formData.content_rich}
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
                <p>• 分享内容应积极向上，遵守社区规范</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SubmitSharePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitShareForm />
    </Suspense>
  )
}