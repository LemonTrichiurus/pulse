import { createSupabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User, MessageCircle, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import CommentForm from '@/components/CommentForm'
import CommentList from '@/components/CommentList'

export const dynamic = 'force-dynamic'

interface TopicDetailPageProps {
  params: {
    id: string
  }
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const supabase = await createSupabaseServer()
  const { id } = await params

  // 获取当前用户信息
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile = null
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  // 获取话题详情
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      body_rich,
      status,
      created_at,
      profiles!topics_author_id_fkey (
        display_name,
        role
      )
    `)
    .eq('id', id)
    .single()

  if (topicError || !topic) {
    notFound()
  }

  // 获取评论列表
  let comments = []
  
  if (user) {
    // 登录用户：获取所有 APPROVED 评论 + 自己的所有状态评论
    const { data: approvedComments } = await supabase
      .from('comments')
      .select(`
        id,
        body_rich,
        status,
        created_at,
        profiles!comments_author_id_fkey (
          id,
          display_name,
          role
        )
      `)
      .eq('topic_id', id)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: true })

    const { data: userComments } = await supabase
      .from('comments')
      .select(`
        id,
        body_rich,
        status,
        created_at,
        profiles!comments_author_id_fkey (
          id,
          display_name,
          role
        )
      `)
      .eq('topic_id', id)
      .eq('author_id', user.id)
      .order('created_at', { ascending: true })

    // 合并评论并去重
    const allComments = [...(approvedComments || []), ...(userComments || [])]
    const uniqueComments = allComments.filter((comment, index, self) => 
      index === self.findIndex(c => c.id === comment.id)
    )
    comments = uniqueComments.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  } else {
    // 匿名用户：只能看到 APPROVED 评论
    const { data: approvedComments } = await supabase
      .from('comments')
      .select(`
        id,
        body_rich,
        status,
        created_at,
        profiles!comments_author_id_fkey (
          id,
          display_name,
          role
        )
      `)
      .eq('topic_id', id)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: true })
    
    comments = approvedComments || []
  }

  const isLocked = topic.status === 'LOCKED'
  const canComment = user && !isLocked
  const isModerator = userProfile?.role && ['MOD', 'ADMIN'].includes(userProfile.role)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/topics">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回话题列表</span>
          </Button>
        </Link>
      </div>

      {/* 话题详情 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-4">{topic.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{topic.profiles?.display_name || '未知用户'}</span>
                  {topic.profiles?.role && ['MOD', 'ADMIN'].includes(topic.profiles.role) && (
                    <Badge variant="outline" className="text-xs">
                      {topic.profiles.role === 'ADMIN' ? '管理员' : '版主'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(topic.created_at), {
                      addSuffix: true,
                      locale: zhCN
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={topic.status === 'OPEN' ? 'default' : 'secondary'}>
                {topic.status === 'OPEN' ? '开放' : '锁定'}
              </Badge>
              {isLocked && <Lock className="h-4 w-4 text-gray-500" />}
            </div>
          </div>
        </CardHeader>
        {topic.body_rich && (
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: topic.body_rich }}
            />
          </CardContent>
        )}
      </Card>

      {/* 评论统计 */}
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-5 w-5 text-gray-500" />
        <span className="text-lg font-medium">
          {comments.filter(c => c.status === 'APPROVED').length} 条评论
        </span>
        {user && comments.filter(c => c.profiles?.id === user.id && c.status !== 'APPROVED').length > 0 && (
          <span className="text-sm text-gray-500">
            （包含 {comments.filter(c => c.profiles?.id === user.id && c.status !== 'APPROVED').length} 条待审核评论）
          </span>
        )}
      </div>

      {/* 评论列表 */}
      <CommentList 
        comments={comments} 
        currentUserId={user?.id}
        isModerator={isModerator}
      />

      {/* 评论表单 */}
      {canComment ? (
        <div className="mt-8">
          <CommentForm topicId={id} />
        </div>
      ) : (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
          {!user ? (
            <p className="text-gray-600">
              请 <Link href="/auth/login" className="text-blue-600 hover:underline">登录</Link> 后发表评论
            </p>
          ) : isLocked ? (
            <p className="text-gray-600 flex items-center justify-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>该话题已锁定，无法评论</span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}