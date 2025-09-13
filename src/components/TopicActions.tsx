'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Lock, Unlock, Trash2, Loader2 } from 'lucide-react'
import { lockTopic, unlockTopic, deleteTopic } from '@/lib/actions/topic-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TopicActionsProps {
  topicId: string
  currentStatus: 'OPEN' | 'LOCKED'
  isAdmin: boolean
}

export default function TopicActions({ topicId, currentStatus, isAdmin }: TopicActionsProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleToggleStatus = async () => {
    setIsToggling(true)
    
    try {
      const result = currentStatus === 'OPEN' 
        ? await lockTopic(topicId)
        : await unlockTopic(topicId)

      if (result.success) {
        toast.success(`话题已${currentStatus === 'OPEN' ? '锁定' : '解锁'}`)
        router.refresh()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('操作失败:', error)
      toast.error('操作失败')
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteTopic(topicId)

      if (result.success) {
        toast.success('话题删除成功')
        router.refresh()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 锁定/解锁按钮 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isToggling}>
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStatus === 'OPEN' ? (
              <>
                <Lock className="h-4 w-4 mr-1" />
                锁定
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-1" />
                解锁
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentStatus === 'OPEN' ? '锁定话题' : '解锁话题'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentStatus === 'OPEN' 
                ? '锁定后，普通用户将无法在此话题下发表评论。只有管理员和版主可以继续评论。'
                : '解锁后，所有用户都可以在此话题下发表评论。'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              确认{currentStatus === 'OPEN' ? '锁定' : '解锁'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除按钮 - 仅管理员可见 */}
      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除话题</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这个话题吗？此操作将同时删除该话题下的所有评论，且无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}