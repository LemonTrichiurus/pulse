'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createTopic } from '@/lib/actions/topic-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreateTopicForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body_rich: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('请输入话题标题')
      return
    }
    
    if (!formData.body_rich.trim()) {
      toast.error('请输入话题内容')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 创建FormData对象
      const form = new FormData()
      form.append('title', formData.title.trim())
      form.append('body_rich', formData.body_rich.trim())
      
      const result = await createTopic(form)
      
      if (result.success) {
        toast.success(result.message || '话题创建成功')
        setFormData({ title: '', body_rich: '' })
        setIsOpen(false)
        router.refresh() // 刷新页面以显示新话题
      } else {
        toast.error(result.error || '创建话题失败')
      }
    } catch (error) {
      console.error('创建话题失败:', error)
      toast.error('创建话题失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({ title: '', body_rich: '' })
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            创建新话题
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建新话题</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">话题标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入话题标题"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">话题内容 *</Label>
            <Textarea
              id="content"
              value={formData.body_rich}
          onChange={(e) => setFormData(prev => ({ ...prev, body_rich: e.target.value }))}
              placeholder="请输入话题内容描述..."
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建话题
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}