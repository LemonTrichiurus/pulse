'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Plus, X, Upload } from 'lucide-react'
import Link from 'next/link'

interface SharespeareFormData {
  title: string
  content_rich: string
  media_url: string
  media_urls: string[]
  status: 'DRAFT' | 'PUBLISHED'
}

export default function CreateSharespearePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SharespeareFormData>({
    title: '',
    content_rich: '',
    media_url: '',
    media_urls: [],
    status: 'DRAFT'
  })

  const handleInputChange = (field: keyof SharespeareFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddMediaUrl = () => {
    if (formData.media_urls.length >= 10) {
      toast.error('最多只能添加10张图片')
      return
    }
    setFormData(prev => ({
      ...prev,
      media_urls: [...prev.media_urls, '']
    }))
  }

  const handleMediaUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.map((url, i) => i === index ? value : url)
    }))
  }

  const handleRemoveMediaUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 过滤掉空的媒体URL
      const filteredMediaUrls = formData.media_urls.filter(url => url.trim() !== '')
      
      const submitData = {
        ...formData,
        media_urls: filteredMediaUrls.length > 0 ? filteredMediaUrls : undefined,
        media_url: formData.media_url.trim() || undefined
      }

      const response = await fetch('/api/sharespeare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建失败')
      }

      const result = await response.json()
      toast.success('Sharespeare作品创建成功！')
      router.push('/admin/sharespeare')
    } catch (error) {
      console.error('创建失败:', error)
      toast.error(error instanceof Error ? error.message : '创建失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/admin/sharespeare">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">创建Sharespeare作品</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作品信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入作品标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_rich">内容 *</Label>
              <Textarea
                id="content_rich"
                value={formData.content_rich}
                onChange={(e) => handleInputChange('content_rich', e.target.value)}
                placeholder="请输入作品内容"
                rows={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media_url">主图片URL（可选）</Label>
              <Input
                id="media_url"
                type="url"
                value={formData.media_url}
                onChange={(e) => handleInputChange('media_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>附加图片URLs（可选）</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMediaUrl}
                  disabled={formData.media_urls.length >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加图片
                </Button>
              </div>
              
              {formData.media_urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => handleMediaUrlChange(index, e.target.value)}
                    placeholder={`图片URL ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMediaUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.media_urls.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  已添加 {formData.media_urls.length}/10 张图片
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'DRAFT' | 'PUBLISHED') => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '创建中...' : '创建作品'}
              </Button>
              <Link href="/admin/sharespeare">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}