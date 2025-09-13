'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { approveComment, rejectComment } from '@/lib/actions/comment-actions'
import { toast } from 'sonner'

interface Comment {
  id: string
  body_rich: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  profiles: {
    id: string
    display_name: string
    role: string
  }
}

interface CommentListProps {
  comments: Comment[]
  currentUserId?: string
  isModerator?: boolean
}

export default function CommentList({ comments, currentUserId, isModerator }: CommentListProps) {
  const handleApprove = async (commentId: string) => {
    try {
      await approveComment(commentId)
      toast.success('评论已审核通过')
    } catch (error) {
      toast.error('审核失败，请重试')
    }
  }

  const handleReject = async (commentId: string) => {
    try {
      await rejectComment(commentId)
      toast.success('评论已被拒绝')
    } catch (error) {
      toast.error('操作失败，请重试')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            待审核
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            已通过
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        )
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <Badge variant="destructive" className="text-xs">
          管理员
        </Badge>
      )
    }
    if (role === 'MOD') {
      return (
        <Badge variant="secondary" className="text-xs">
          版主
        </Badge>
      )
    }
    return null
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          暂无评论，快来发表第一条评论吧！
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, index) => {
        const isOwnComment = currentUserId === comment.profiles.id
        const showToUser = comment.status === 'APPROVED' || isOwnComment
        
        if (!showToUser) return null

        return (
          <Card key={comment.id} className={comment.status !== 'APPROVED' ? 'border-yellow-200 bg-yellow-50' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                {/* 楼层号 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">楼</span>
                </div>

                {/* 头像 */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {comment.profiles.display_name.charAt(0).toUpperCase()}
                </div>

                {/* 评论内容 */}
                <div className="flex-1">
                  {/* 用户信息和状态 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{comment.profiles.display_name}</span>
                        {getRoleBadge(comment.profiles.role)}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 状态 Badge */}
                      {(comment.status !== 'APPROVED' || isModerator) && getStatusBadge(comment.status)}
                      
                      {/* 审核按钮 */}
                      {isModerator && comment.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(comment.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(comment.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 评论正文 */}
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-800">{comment.body_rich}</p>
                  </div>

                  {/* 状态提示 */}
                  {isOwnComment && comment.status === 'PENDING' && (
                    <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        您的评论正在等待审核，审核通过后将对所有用户可见。
                      </p>
                    </div>
                  )}
                  
                  {isOwnComment && comment.status === 'REJECTED' && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <XCircle className="h-4 w-4 inline mr-1" />
                        您的评论未通过审核，请检查内容是否符合社区规范。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}