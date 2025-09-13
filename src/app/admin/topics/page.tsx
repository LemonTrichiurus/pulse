import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Lock, Unlock, Trash2, User, Clock, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import CreateTopicForm from '@/components/CreateTopicForm'
import TopicActions from '@/components/TopicActions'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  status?: string
}

interface AdminTopicsPageProps {
  searchParams: SearchParams
}

export default async function AdminTopicsPage({ searchParams }: AdminTopicsPageProps) {
  const supabase = await createSupabaseServer()
  const resolvedSearchParams = await searchParams
  
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

  // 分页参数
  const page = parseInt(resolvedSearchParams.page || '1')
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // 状态筛选
  const statusFilter = resolvedSearchParams.status || 'all'

  // 构建查询
  let query = supabase
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
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter.toUpperCase())
  }

  const { data: topics, error, count } = await query
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('获取话题列表失败:', error)
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  // 获取每个话题的评论统计
  const topicsWithStats = await Promise.all(
    (topics || []).map(async (topic) => {
      const { count: approvedCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id)
        .eq('status', 'APPROVED')

      const { count: pendingCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id)
        .eq('status', 'PENDING')

      return {
        ...topic,
        approved_count: approvedCount || 0,
        pending_count: pendingCount || 0
      }
    })
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/topics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回话题列表
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">话题管理</h1>
            <p className="text-gray-600 mt-1">管理所有话题，创建新话题</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/comments">
            <Button variant="outline">
              评论审核
            </Button>
          </Link>
        </div>
      </div>

      {/* 创建话题表单 */}
      <div className="mb-8">
        <CreateTopicForm />
      </div>

      {/* 筛选器 */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-sm font-medium">状态筛选：</span>
        <div className="flex space-x-2">
          <Link href="/admin/topics?status=all">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
            >
              全部
            </Button>
          </Link>
          <Link href="/admin/topics?status=open">
            <Button 
              variant={statusFilter === 'open' ? 'default' : 'outline'} 
              size="sm"
            >
              开放
            </Button>
          </Link>
          <Link href="/admin/topics?status=locked">
            <Button 
              variant={statusFilter === 'locked' ? 'default' : 'outline'} 
              size="sm"
            >
              锁定
            </Button>
          </Link>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="space-y-4">
        {topicsWithStats.length > 0 ? (
          topicsWithStats.map((topic) => (
            <Card key={topic.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 话题标题和状态 */}
                    <div className="flex items-center space-x-3 mb-3">
                      <Link 
                        href={`/topics/${topic.id}`}
                        className="text-xl font-semibold hover:text-blue-600 transition-colors"
                      >
                        {topic.title}
                      </Link>
                      <Badge variant={topic.status === 'OPEN' ? 'default' : 'secondary'}>
                        {topic.status === 'OPEN' ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            开放
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            锁定
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* 话题内容预览 */}
                    {topic.body_rich && (
                      <p className="text-gray-600 text-sm mt-2">
                        <span 
                          dangerouslySetInnerHTML={{
                            __html: topic.body_rich.substring(0, 200) + (topic.body_rich.length > 200 ? '...' : '')
                          }}
                        />
                      </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{topic.profiles?.display_name || '未知用户'}</span>
                        {topic.profiles?.role && ['MOD', 'ADMIN'].includes(topic.profiles.role) && (
                          <Badge variant="outline" className="text-xs ml-1">
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
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{topic.approved_count} 条评论</span>
                        {topic.pending_count > 0 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600 ml-1">
                            {topic.pending_count} 待审核
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 ml-4">
                    <TopicActions 
                      topicId={topic.id}
                      currentStatus={topic.status}
                      isAdmin={profile.role === 'ADMIN'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {statusFilter === 'all' ? '暂无话题' : `暂无${statusFilter === 'open' ? '开放' : '锁定'}状态的话题`}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {page > 1 && (
            <Link href={`/admin/topics?page=${page - 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}>
              <Button variant="outline" size="sm">
                上一页
              </Button>
            </Link>
          )}
          
          <span className="text-sm text-gray-600">
            第 {page} 页，共 {totalPages} 页
          </span>
          
          {page < totalPages && (
            <Link href={`/admin/topics?page=${page + 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}>
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