import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ModerationHeader from '@/components/admin/ModerationHeader'
import ModerationFilter from '@/components/admin/ModerationFilter'
import ModerationCommentCard from '@/components/admin/ModerationCommentCard'
import ModerationEmptyState from '@/components/admin/ModerationEmptyState'
import ModerationPagination from '@/components/admin/ModerationPagination'

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
      <ModerationHeader pendingCount={count || 0} />

      {/* 筛选器 */}
      <ModerationFilter topics={topics || []} currentTopicFilter={topicFilter} />

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <ModerationCommentCard key={comment.id} comment={comment} />
          ))
        ) : (
          <ModerationEmptyState hasTopicFilter={!!topicFilter} />
        )}
      </div>

      {/* 分页 */}
      <ModerationPagination 
        currentPage={page}
        totalPages={totalPages}
        topicFilter={topicFilter}
      />
    </div>
  )
}