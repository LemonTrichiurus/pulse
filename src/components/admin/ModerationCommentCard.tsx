'use client'

import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Clock, MessageCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import CommentModerationActions from '@/components/CommentModerationActions'

interface Comment {
  id: string
  body_rich: string
  status: string
  created_at: string
  topic_id: string
  profiles?: {
    display_name?: string
    role?: string
  }
  topics?: {
    id: string
    title: string
    status: string
  }
}

interface ModerationCommentCardProps {
  comment: Comment
}

export default function ModerationCommentCard({ comment }: ModerationCommentCardProps) {
  const { t, language } = useI18n()

  const getDateLocale = () => {
    return language === 'zh' ? zhCN : enUS
  }

  const getRoleText = (role: string) => {
    if (role === 'ADMIN') return t('moderation.admin')
    if (role === 'MOD') return t('moderation.moderator')
    return ''
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 评论头部信息 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 话题信息 */}
              <div className="flex items-center space-x-2 mb-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <Link 
                  href={`/topics/${comment.topics?.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {comment.topics?.title}
                </Link>
                {comment.topics?.status === 'LOCKED' && (
                  <Badge variant="secondary" className="text-xs">
                    {t('moderation.locked')}
                  </Badge>
                )}
              </div>

              {/* 作者和时间信息 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{comment.profiles?.display_name || t('moderation.unknown_user')}</span>
                  {comment.profiles?.role && ['MOD', 'ADMIN'].includes(comment.profiles.role) && (
                    <Badge variant="outline" className="text-xs ml-1">
                      {getRoleText(comment.profiles.role)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: getDateLocale()
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 状态 Badge */}
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('moderation.pending')}
            </Badge>
          </div>

          {/* 评论内容 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm whitespace-pre-wrap break-words">
              {comment.body_rich}
            </div>
          </div>

          {/* 审核操作 */}
          <div className="flex justify-end">
            <CommentModerationActions 
              commentId={String(comment.id)}
              topicId={String(comment.topic_id)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}