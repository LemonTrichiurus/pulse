import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Clock, MessageCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import CommentModerationActions from '@/components/CommentModerationActions'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  topic?: string
}

interface AdminCommentsPageProps {
  searchParams: SearchParams
}

export default async function AdminCommentsPage({ searchParams }: AdminCommentsPageProps) {
  const supabase = await createSupabaseServer()
  
  // 检查用户权限
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['MOD', 'ADMIN'].includes(profile.role)) {
    redirect('/topics')
  }

  // 等待 searchParams
  const resolvedSearchParams = await searchParams

  // 分页参数
  const page = parseInt(resolvedSearchParams.page || '1')
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // 话题筛选
  const topicFilter = resolvedSearchParams.topic

  // 构建查询 - 只查询 PENDING 状态的评论
  let query = supabase
    .from('comments')
    .select(`
      id,
      body_rich,
      status,
      created_at,
      topic_id,
      profiles!comments_author_id_fkey (
          display_name,
          role
        ),
      topics!comments_topic_id_fkey (
        id,
        title,
        status
      )
    `, { count: 'exact' })
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (topicFilter) {
    query = query.eq('topic_id', topicFilter)
  }

  const { data: comments, error, count } = await query
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('获取评论列表失败:', error)
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  // 获取所有话题用于筛选
  const { data: topics } = await supabase
    .from('topics')
    .select('id, title')
    .order('title')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/topics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回话题管理
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">评论审核</h1>
            <p className="text-gray-600 mt-1">审核待处理的评论</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            {count || 0} 条待审核
          </Badge>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-sm font-medium">话题筛选：</span>
        <div className="flex space-x-2 flex-wrap">
          <Link href="/admin/comments">
            <Button 
              variant={!topicFilter ? 'default' : 'outline'} 
              size="sm"
            >
              全部话题
            </Button>
          </Link>
          {topics?.slice(0, 5).map((topic) => (
            <Link key={topic.id} href={`/admin/comments?topic=${topic.id}`}>
              <Button 
                variant={topicFilter === topic.id ? 'default' : 'outline'} 
                size="sm"
                className="max-w-48 truncate"
              >
                {topic.title}
              </Button>
            </Link>
          ))}
          {topics && topics.length > 5 && (
            <span className="text-sm text-gray-500 self-center">
              +{topics.length - 5} 个话题
            </span>
          )}
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
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
                            已锁定
                          </Badge>
                        )}
                      </div>

                      {/* 作者和时间信息 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{comment.profiles?.display_name || '未知用户'}</span>
                          {comment.profiles?.role && ['MOD', 'ADMIN'].includes(comment.profiles.role) && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {comment.profiles.role === 'ADMIN' ? '管理员' : '版主'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: zhCN
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 状态 Badge */}
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      待审核
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
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">暂无待审核评论</h3>
              <p className="text-sm">
                {topicFilter ? '该话题下暂无待审核评论' : '所有评论都已审核完毕'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {page > 1 && (
            <Link href={`/admin/comments?page=${page - 1}${topicFilter ? `&topic=${topicFilter}` : ''}`}>
              <Button variant="outline" size="sm">
                上一页
              </Button>
            </Link>
          )}
          
          <span className="text-sm text-gray-600">
            第 {page} 页，共 {totalPages} 页
          </span>
          
          {page < totalPages && (
            <Link href={`/admin/comments?page=${page + 1}${topicFilter ? `&topic=${topicFilter}` : ''}`}>
              <Button variant="outline" size="sm">
                下一页
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}