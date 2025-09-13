'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CommentModerationActionsProps {
  commentId: string
  topicId: string
}

export default function CommentModerationActions({ commentId, topicId }: CommentModerationActionsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('登录状态已失效，请重新登录')
        return
      }

      const response = await fetch('/api/comments/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          comment_id: String(commentId),
          status: 'APPROVED'
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || '评论已通过审核')
        router.refresh()
      } else {
        toast.error(result.error || '审核失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('审核失败')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('登录状态已失效，请重新登录')
        return
      }

      const response = await fetch('/api/comments/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          comment_id: String(commentId),
          status: 'REJECTED',
          reason: rejectReason.trim() || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || '评论已拒绝')
        setRejectReason('')
        setRejectDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('操作失败:', error)
      toast.error('操作失败')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 通过按钮 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-green-600 border-green-600 hover:bg-green-50"
            disabled={isApproving}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                通过
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通过评论</AlertDialogTitle>
            <AlertDialogDescription>
              确定要通过这条评论吗？通过后，评论将对所有用户可见。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              确认通过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 拒绝按钮 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 border-red-600 hover:bg-red-50"
            disabled={isRejecting}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                拒绝
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝评论</DialogTitle>
            <DialogDescription>
              请说明拒绝这条评论的原因（可选）。拒绝后，评论将不会公开显示，但作者可以看到拒绝状态和原因。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">拒绝原因（可选）</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因，如：内容不当、违反社区规则等..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectReason('')
                setRejectDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认拒绝'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}