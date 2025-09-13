'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send } from 'lucide-react'
import { postComment } from '@/lib/actions/comment-actions'
import { toast } from 'sonner'

interface CommentFormProps {
  topicId: string
}

export default function CommentForm({ topicId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    if (content.length > 1000) {
      toast.error('评论内容不能超过1000字符')
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('topicId', topicId)
      formData.append('content', content.trim())
      
      await postComment(formData)
      setContent('')
      toast.success('评论已提交，等待审核后显示')
    } catch (error) {
      console.error('提交评论失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          <span>发表评论</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法...（评论将在审核后显示）"
              className="min-h-[120px] resize-none"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {content.length}/1000 字符
              </span>
              <span className="text-xs text-gray-400">
                评论需要审核后才会显示
              </span>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? '提交中...' : '发表评论'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}