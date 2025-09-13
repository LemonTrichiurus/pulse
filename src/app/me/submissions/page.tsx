'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Edit, 
  Trash2, 
  Send, 
  Eye, 
  RefreshCw, 
  FileText, 
  Share2,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { 
  getUserSubmissions, 
  reworkNews, 
  reworkShare, 
  deleteNews, 
  deleteShare,
  submitNews,
  submitShare
} from './actions'

type PublishStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED'
type SubmissionType = 'news' | 'share'

interface Submission {
  id: number
  title: string
  content_rich: string
  category?: string
  media_url?: string
  status: PublishStatus
  created_at: string
  updated_at: string
  published_at?: string
  review_note?: string
  type: SubmissionType
}

interface SubmissionCounts {
  total: number
  draft: number
  pending: number
  published: number
  rejected: number
}

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800', variant: 'secondary' as const },
  PENDING: { label: '待审核', color: 'bg-yellow-100 text-yellow-800', variant: 'default' as const },
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-800', variant: 'default' as const },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-800', variant: 'destructive' as const }
}

const typeConfig = {
  news: { label: '新闻', icon: FileText, color: 'text-blue-600' },
  share: { label: '分享', icon: Share2, color: 'text-purple-600' }
}

export default function MySubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [counts, setCounts] = useState<SubmissionCounts>({
    total: 0,
    draft: 0,
    pending: 0,
    published: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  const loadSubmissions = async (status?: string) => {
    setLoading(true)
    try {
      const result = await getUserSubmissions(status)
      if (result.success) {
        setSubmissions(result.data || [])
        setCounts(result.counts || {
          total: 0,
          draft: 0,
          pending: 0,
          published: 0,
          rejected: 0
        })
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('加载投稿列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions(activeTab === 'ALL' ? undefined : activeTab)
  }, [activeTab])

  const handleAction = async (action: string, id: number, type: SubmissionType) => {
    const actionKey = `${action}-${id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      let result
      switch (action) {
        case 'rework':
          result = type === 'news' ? await reworkNews(id) : await reworkShare(id)
          break
        case 'delete':
          result = type === 'news' ? await deleteNews(id) : await deleteShare(id)
          break
        case 'submit':
          result = type === 'news' ? await submitNews(id) : await submitShare(id)
          break
        default:
          return
      }

      if (result.success) {
        toast.success(result.message)
        loadSubmissions(activeTab === 'ALL' ? undefined : activeTab)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getContentPreview = (content: string, maxLength = 100) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent
  }

  const renderSubmissionCard = (submission: Submission) => {
    const TypeIcon = typeConfig[submission.type].icon
    const statusInfo = statusConfig[submission.status]
    const actionKey = (action: string) => `${action}-${submission.id}`

    return (
      <Card key={`${submission.type}-${submission.id}`} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <TypeIcon className={`w-5 h-5 ${typeConfig[submission.type].color}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                  {submission.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{typeConfig[submission.type].label}</span>
                  {submission.category && (
                    <>
                      <span>•</span>
                      <span>{submission.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {getContentPreview(submission.content_rich)}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>创建于 {formatDate(submission.created_at)}</span>
            </div>
            {submission.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>发布于 {formatDate(submission.published_at)}</span>
              </div>
            )}
          </div>

          {submission.review_note && submission.status === 'REJECTED' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    审核意见：
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {submission.review_note}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {submission.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/submit/${submission.type}?edit=${submission.id}`)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction('submit', submission.id, submission.type)}
                  disabled={actionLoading[actionKey('submit')]}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {actionLoading[actionKey('submit')] ? '提交中...' : '提交审核'}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认删除</DialogTitle>
                      <DialogDescription>
                        确定要删除「{submission.title}」吗？此操作不可撤销。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline">取消</Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction('delete', submission.id, submission.type)}
                        disabled={actionLoading[actionKey('delete')]}
                      >
                        {actionLoading[actionKey('delete')] ? '删除中...' : '确认删除'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {submission.status === 'PENDING' && (
              <Button size="sm" variant="outline" disabled>
                <Eye className="w-4 h-4 mr-1" />
                审核中
              </Button>
            )}

            {submission.status === 'REJECTED' && (
              <Button
                size="sm"
                onClick={() => handleAction('rework', submission.id, submission.type)}
                disabled={actionLoading[actionKey('rework')]}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {actionLoading[actionKey('rework')] ? '返工中...' : '返工为草稿'}
              </Button>
            )}

            {submission.status === 'PUBLISHED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const path = submission.type === 'news' 
                    ? `/news/${submission.id}` 
                    : `/sharespeare/${submission.id}`
                  router.push(path)
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                查看
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              我的投稿
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理您的所有投稿内容，查看审核状态和反馈
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {counts.total}
                </div>
                <div className="text-sm text-gray-500">总计</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {counts.draft}
                </div>
                <div className="text-sm text-gray-500">草稿</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {counts.pending}
                </div>
                <div className="text-sm text-gray-500">待审核</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {counts.published}
                </div>
                <div className="text-sm text-gray-500">已发布</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {counts.rejected}
                </div>
                <div className="text-sm text-gray-500">已拒绝</div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选标签 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ALL">全部 ({counts.total})</TabsTrigger>
              <TabsTrigger value="DRAFT">草稿 ({counts.draft})</TabsTrigger>
              <TabsTrigger value="PENDING">待审核 ({counts.pending})</TabsTrigger>
              <TabsTrigger value="PUBLISHED">已发布 ({counts.published})</TabsTrigger>
              <TabsTrigger value="REJECTED">已拒绝 ({counts.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    {activeTab === 'ALL' ? '暂无投稿' : `暂无${statusConfig[activeTab as PublishStatus]?.label || ''}投稿`}
                  </div>
                  <Button onClick={() => router.push('/submit/news')}>
                    开始投稿
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map(renderSubmissionCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}