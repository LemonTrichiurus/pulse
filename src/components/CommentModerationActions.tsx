'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/contexts/I18nContext'
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
  const { t } = useI18n()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error(t('moderation.login_expired'))
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
        toast.success(result.message || t('moderation.comment_approved'))
        router.refresh()
      } else {
        toast.error(result.error || t('moderation.operation_failed'))
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error(t('moderation.operation_failed'))
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
        toast.error(t('moderation.login_expired'))
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
        toast.success(result.message || t('moderation.comment_rejected'))
        setRejectReason('')
        setRejectDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || t('moderation.operation_failed'))
      }
    } catch (error) {
      console.error('操作失败:', error)
      toast.error(t('moderation.operation_failed'))
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
                {t('moderation.approve')}
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('moderation.approve_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('moderation.approve_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('moderation.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {t('moderation.confirm_approve')}
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
                {t('moderation.reject')}
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('moderation.reject_title')}</DialogTitle>
            <DialogDescription>
              {t('moderation.reject_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t('moderation.reject_reason_label')}</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('moderation.reject_reason_placeholder')}
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
              {t('moderation.cancel')}
            </Button>
            <Button 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('moderation.processing')}
                </>
              ) : (
                t('moderation.confirm_reject')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}