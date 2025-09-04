'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Eye, MessageCircle, Heart, Share2, Pin, Lock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
// 移除认证相关导入
import { toast } from 'sonner'

// 模拟话题详情数据
const mockTopicDetail = {
  id: '1',
  title: '关于期末考试复习方法的讨论',
  content: `马上就要期末考试了，大家都是怎么复习的？有什么好的方法可以分享一下吗？特别是数学和物理这两门课，感觉知识点很多，不知道从哪里开始复习。

我目前的复习计划是：
1. 先把课本过一遍，梳理知识点
2. 做一些练习题巩固
3. 整理错题本

但是感觉效率不高，希望大家能分享一些更好的方法！`,
  category: 'academic' as const,
  tags: ['考试', '复习', '学习方法'],
  author: {
    id: 'user1',
    name: '张同学',
    avatar: '/images/student-avatar-1.jpg',
    role: 'member' as const
  },
  is_pinned: false,
  is_locked: false,
  view_count: 234,
  like_count: 45,
  comment_count: 18,
  last_activity_at: '2024-01-15T16:30:00Z',
  created_at: '2024-01-14T09:00:00Z',
  is_liked: false
}

// 模拟评论数据（楼中楼结构）
const mockComments = [
  {
    id: '1',
    content: '我觉得做思维导图很有用！可以把知识点之间的联系梳理清楚，复习的时候一目了然。',
    author: {
      id: 'user2',
      name: '李同学',
      avatar: '/images/student-avatar-2.jpg',
      role: 'member' as const
    },
    created_at: '2024-01-14T10:30:00Z',
    like_count: 12,
    is_liked: false,
    floor: 1,
    replies: [
      {
        id: '1-1',
        content: '同意！我也在用思维导图，特别是数学，把公式和定理都整理在一起。',
        author: {
          id: 'user3',
          name: '王同学',
          role: 'member' as const
        },
        created_at: '2024-01-14T11:00:00Z',
        like_count: 5,
        is_liked: true,
        reply_to: {
          id: 'user2',
          name: '李同学'
        }
      },
      {
        id: '1-2',
        content: '有推荐的思维导图软件吗？我一直用纸笔画，感觉不太方便。',
        author: {
          id: 'user4',
          name: '赵同学',
          role: 'member' as const
        },
        created_at: '2024-01-14T12:15:00Z',
        like_count: 3,
        is_liked: false,
        reply_to: {
          id: 'user2',
          name: '李同学'
        }
      }
    ]
  },
  {
    id: '2',
    content: '我的方法是先做历年真题，找出自己的薄弱环节，然后针对性地复习。这样比较高效。',
    author: {
      id: 'user5',
      name: '陈同学',
      avatar: '/images/student-avatar-3.jpg',
      role: 'member' as const
    },
    created_at: '2024-01-14T14:20:00Z',
    like_count: 18,
    is_liked: true,
    floor: 2,
    replies: [
      {
        id: '2-1',
        content: '这个方法不错！请问历年真题在哪里能找到？',
        author: {
          id: 'user6',
          name: '刘同学',
          role: 'member' as const
        },
        created_at: '2024-01-14T15:00:00Z',
        like_count: 2,
        is_liked: false,
        reply_to: {
          id: 'user5',
          name: '陈同学'
        }
      }
    ]
  },
  {
    id: '3',
    content: '建议大家组成学习小组，互相监督和讨论。我们宿舍就是这样，每天晚上一起复习，效果很好。',
    author: {
      id: 'user7',
      name: '周同学',
      avatar: '/images/student-avatar-4.jpg',
      role: 'moderator' as const
    },
    created_at: '2024-01-15T09:30:00Z',
    like_count: 25,
    is_liked: false,
    floor: 3,
    replies: []
  }
]

interface Reply {
  id: string
  content: string
  author: {
    id: string
    name: string
    role: 'member' | 'moderator' | 'admin'
  }
  created_at: string
  like_count: number
  is_liked: boolean
  reply_to?: {
    id: string
    name: string
  }
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    role: 'member' | 'moderator' | 'admin'
  }
  created_at: string
  like_count: number
  is_liked: boolean
  floor: number
  replies: Reply[]
}

function ReplyItem({ reply, onReply }: { reply: Reply; onReply: (replyTo: { id: string; name: string }) => void }) {
  const [isLiked, setIsLiked] = useState(reply.is_liked)
  const [likeCount, setLikeCount] = useState(reply.like_count)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return (
    <div className="ml-8 mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold">
          {reply.author.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{reply.author.name}</span>
            <Badge className={getRoleColor(reply.author.role)} variant="outline">
              {reply.author.role === 'admin' ? '管理员' : 
               reply.author.role === 'moderator' ? '版主' : '学生'}
            </Badge>
            {reply.reply_to && (
              <span className="text-xs text-muted-foreground">
                回复 @{reply.reply_to.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(reply.created_at)}
            </span>
          </div>
          <p className="text-sm mb-2">{reply.content}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-6 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-muted-foreground"
              onClick={() => onReply({ id: reply.author.id, name: reply.author.name })}
            >
              回复
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (commentId: string, replyTo?: { id: string; name: string }) => void }) {
  const [isLiked, setIsLiked] = useState(comment.is_liked)
  const [likeCount, setLikeCount] = useState(comment.like_count)
  const [showReplies, setShowReplies] = useState(true)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* 楼层号 */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
            {comment.floor}
          </div>
          <span className="text-xs text-muted-foreground mt-1">楼</span>
        </div>

        {/* 头像 */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {comment.author.name.charAt(0)}
        </div>

        {/* 主要内容 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{comment.author.name}</span>
            <Badge className={getRoleColor(comment.author.role)} variant="outline">
              {comment.author.role === 'admin' ? '管理员' : 
               comment.author.role === 'moderator' ? '版主' : '学生'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
          </div>
          
          <p className="mb-3 whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-7 px-3 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-3 text-muted-foreground"
              onClick={() => onReply(comment.id, { id: comment.author.id, name: comment.author.name })}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              回复
            </Button>
            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-7 px-3 text-muted-foreground"
              >
                {showReplies ? (
                  <ChevronUp className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                {comment.replies.length} 条回复
              </Button>
            )}
          </div>

          {/* 回复列表 */}
          {showReplies && comment.replies.length > 0 && (
            <div className="space-y-2">
              {comment.replies.map(reply => (
                <ReplyItem 
                  key={reply.id} 
                  reply={reply} 
                  onReply={(replyTo) => onReply(comment.id, replyTo)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TopicDetailPage() {
  const params = useParams()
  // 移除认证相关逻辑
  const [topic, setTopic] = useState(mockTopicDetail)
  const [comments, setComments] = useState(mockComments)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; replyTo?: { id: string; name: string } } | null>(null)
  const [isLiked, setIsLiked] = useState(topic.is_liked)
  const [likeCount, setLikeCount] = useState(topic.like_count)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'academic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'life': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'tech': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: topic.title,
        text: topic.content.substring(0, 100) + '...',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }

  const handleSubmitComment = () => {
    if (!user) {
      toast.error('请先登录后再评论')
      return
    }
    
    if (!newComment.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    if (replyingTo) {
      // 添加回复
      const newReply = {
        id: Date.now().toString(),
        content: newComment,
        author: {
          id: user.id,
          name: '我',
          role: 'member' as const
        },
        created_at: new Date().toISOString(),
        like_count: 0,
        is_liked: false,
        reply_to: replyingTo.replyTo
      }

      setComments(prev => prev.map(comment => 
        comment.id === replyingTo.commentId 
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      ))
      
      setReplyingTo(null)
    } else {
      // 添加新评论
      const newCommentObj = {
        id: Date.now().toString(),
        content: newComment,
        author: {
          id: user.id,
          name: '我',
          avatar: '/images/default-avatar.jpg',
          role: 'member' as const
        },
        created_at: new Date().toISOString(),
        like_count: 0,
        is_liked: false,
        floor: comments.length + 1,
        replies: []
      }

      setComments(prev => [...prev, newCommentObj])
    }

    setNewComment('')
    toast.success(replyingTo ? '回复发布成功' : '评论发布成功')
  }

  const handleReply = (commentId: string, replyTo?: { id: string; name: string }) => {
    setReplyingTo({ commentId, replyTo })
    setNewComment(replyTo ? `@${replyTo.name} ` : '')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/topics">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回话题广场
          </Button>
        </Link>
      </div>

      {/* 话题主体 */}
      <Card className="mb-8">
        <CardHeader>
          {/* 标题和状态 */}
          <div className="flex items-center gap-2 mb-4">
            {topic.is_pinned && (
              <Pin className="w-5 h-5 text-red-500" />
            )}
            {topic.is_locked && (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
            <Badge className={getCategoryColor(topic.category)}>
              学习交流
            </Badge>
            {topic.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          
          <CardTitle className="text-2xl mb-4">{topic.title}</CardTitle>
          
          {/* 作者信息 */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {topic.author.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{topic.author.name}</span>
                  <Badge variant="outline">
                    {topic.author.role === 'admin' ? '管理员' : 
                     topic.author.role === 'moderator' ? '版主' : '学生'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(topic.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {topic.view_count} 浏览
                  </span>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{topic.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* 评论区 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5" />
          <h2 className="text-xl font-semibold">讨论 ({comments.length})</h2>
        </div>

        {/* 发表评论/回复 */}
        {user ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              {replyingTo && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                  正在回复 {replyingTo.replyTo ? `@${replyingTo.replyTo.name}` : `${comments.find(c => c.id === replyingTo.commentId)?.floor}楼`}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-5 px-2"
                    onClick={() => {
                      setReplyingTo(null)
                      setNewComment('')
                    }}
                  >
                    取消
                  </Button>
                </div>
              )}
              <Textarea
                placeholder={replyingTo ? "写下你的回复..." : "参与讨论，分享你的想法..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmitComment}>
                  {replyingTo ? '发表回复' : '发表评论'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">登录后即可参与讨论</p>
              <Button>登录</Button>
            </CardContent>
          </Card>
        )}

        {/* 评论列表 */}
        <Card>
          <CardContent className="pt-6">
            {comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReply={handleReply}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无讨论，快来发表第一条评论吧！
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}