import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import TopicsHeader from '@/components/topics/TopicsHeader'

export const dynamic = 'force-dynamic'

interface TopicWithStats {
  id: string
  title: string
  body_rich: string | null
  status: string
  created_at: string
  profiles: {
    display_name: string
    role: string
  }
  approved_count: number
}

interface TopicsPageProps {
  searchParams: {
    page?: string
  }
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const supabase = await createSupabaseServer()
  // 修复：searchParams 是对象，不需要 await
  const pageParam = searchParams?.page
  const page = parseInt(pageParam ?? '1')
  const limit = 10
  const offset = (page - 1) * limit

  // 获取话题列表，包含已审核评论数
  const { data: topics, error } = await supabase
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
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('获取话题列表失败:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          获取话题列表失败，请稍后重试
        </div>
      </div>
    )
  }

  // 为每个话题获取已审核评论数
  const topicsWithStats: TopicWithStats[] = []
  
  if (topics) {
    for (const topic of topics) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id)
        .eq('status', 'APPROVED')

      topicsWithStats.push({
        ...topic,
        approved_count: count || 0
      })
    }
  }

  // 获取总数用于分页
  const { count: totalCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'OPEN')

  const totalPages = Math.ceil((totalCount || 0) / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <TopicsHeader />

      {topicsWithStats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无话题</h3>
            <p className="text-gray-600">还没有人发布话题，成为第一个吧！</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {topicsWithStats.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      <Link 
                        href={`/topics/${topic.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {topic.title}
                      </Link>
                    </CardTitle>
                    {topic.body_rich && (
                      <p className="text-gray-600 line-clamp-2">
                        {topic.body_rich.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {topic.status === 'OPEN' ? '开放' : '锁定'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
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
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{topic.approved_count} 条评论</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {page > 1 && (
            <Link href={`/topics?page=${page - 1}`}>
              <Button variant="outline">上一页</Button>
            </Link>
          )}
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              
              return (
                <Link key={pageNum} href={`/topics?page=${pageNum}`}>
                  <Button 
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                </Link>
              )
            })}
          </div>

          {page < totalPages && (
            <Link href={`/topics?page=${page + 1}`}>
              <Button variant="outline">下一页</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}