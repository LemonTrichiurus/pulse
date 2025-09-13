'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Check, 
  X, 
  FileText, 
  Share2, 
  Calendar, 
  User, 
  Eye,
  MessageSquare,
  Save
} from 'lucide-react'
import { 
  getPendingSubmissions,
  approveNews,
  rejectNews,
  approveShare,
  rejectShare,
  updateReviewNote
} from './actions'

type SubmissionType = 'news' | 'share'

interface PendingSubmission {
  id: number
  title: string
  content_rich: string
  category?: string
  media_url?: string
  status: string
  created_at: string
  author_id: string
  author_email: string
  type: SubmissionType
}

interface PendingData {
  news: PendingSubmission[]
  shares: PendingSubmission[]
}

const typeConfig = {
  news: { label: '新闻', icon: FileText, color: 'text-blue-600' },
  share: { label: '分享', icon: Share2, color: 'text-purple-600' }
}

export default function AdminReviewPage() {
  const [pendingData, setPendingData] = useState<PendingData>({ news: [], shares: [] })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({})
  const [rejectNote, setRejectNote] = useState('')
  const [selectedItem, setSelectedItem] = useState<PendingSubmission | null>(null)
  const [activeTab, setActiveTab] = useState('news')

  const loadPendingSubmissions = async () => {
    setLoading(true)
    try {
      const result = await getPendingSubmissions()
      if (result.success) {
        setPendingData(result.data || { news: [], shares: [] })
        // 初始化审核备注
        const notes: { [key: string]: string } = {}
        result.data?.news.forEach(item => {
          notes[`news-${item.id}`] = ''
        })
        result.data?.shares.forEach(item => {
          notes[`share-${item.id}`] = ''
        })
        setReviewNotes(notes)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('加载待审核内容失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingSubmissions()
  }, [])

  const handleApprove = async (id: number, type: SubmissionType) => {
    const actionKey = `approve-${type}-${id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const note = reviewNotes[`${type}-${id}`]
      const result = type === 'news' 
        ? await approveNews(id, note) 
        : await approveShare(id, note)

      if (result.success) {
        toast.success(result.message)
        loadPendingSubmissions()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('审核失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleReject = async (id: number, type: SubmissionType, note: string) => {
    if (!note.trim()) {
      toast.error('拒绝时必须填写审核意见')
      return
    }

    const actionKey = `reject-${type}-${id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const result = type === 'news' 
        ? await rejectNews(id, note) 
        : await rejectShare(id, note)

      if (result.success) {
        toast.success(result.message)
        loadPendingSubmissions()
        setRejectNote('')
        setSelectedItem(null)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('审核失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleUpdateNote = async (id: number, type: SubmissionType, note: string) => {
    try {
      const result = await updateReviewNote(id, type, note)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('更新备注失败')
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

  const renderSubmissionTable = (submissions: PendingSubmission[], type: SubmissionType) => {
    if (submissions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500">
            暂无待审核的{typeConfig[type].label}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {submissions.map((item) => {
          const noteKey = `${type}-${item.id}`
          const approveKey = `approve-${type}-${item.id}`
          const rejectKey = `reject-${type}-${item.id}`
          const TypeIcon = typeConfig[type].icon

          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <TypeIcon className={`w-5 h-5 ${typeConfig[type].color}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{item.author_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        {item.category && (
                          <Badge variant="outline">{item.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {getContentPreview(item.content_rich, 200)}
                  </p>
                  {item.media_url && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">媒体链接：</span>
                      <a 
                        href={item.media_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm ml-1"
                      >
                        {item.media_url}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    审核备注（可选）
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="添加审核备注..."
                      value={reviewNotes[noteKey] || ''}
                      onChange={(e) => setReviewNotes(prev => ({ 
                        ...prev, 
                        [noteKey]: e.target.value 
                      }))}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateNote(item.id, type, reviewNotes[noteKey] || '')}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        预览
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <TypeIcon className={`w-5 h-5 ${typeConfig[type].color}`} />
                          {item.title}
                        </DialogTitle>
                        <DialogDescription>
                          作者：{item.author_email} | 创建时间：{formatDate(item.created_at)}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <div 
                          className="prose max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: item.content_rich }}
                        />
                        {item.media_url && (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm font-medium">媒体链接：</span>
                            <a 
                              href={item.media_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-2"
                            >
                              {item.media_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    onClick={() => handleApprove(item.id, type)}
                    disabled={actionLoading[approveKey]}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {actionLoading[approveKey] ? '审核中...' : '通过'}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          setSelectedItem(item)
                          setRejectNote('')
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          拒绝审核
                        </DialogTitle>
                        <DialogDescription>
                          请填写拒绝理由，这将发送给作者用于改进内容。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            拒绝理由 *
                          </label>
                          <Textarea
                            placeholder="请详细说明拒绝的原因，帮助作者改进内容..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setSelectedItem(null)}>
                            取消
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => selectedItem && handleReject(selectedItem.id, selectedItem.type, rejectNote)}
                            disabled={!rejectNote.trim() || actionLoading[rejectKey]}
                          >
                            {actionLoading[rejectKey] ? '处理中...' : '确认拒绝'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              内容审核
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              审核用户提交的新闻和分享内容，确保内容质量和合规性
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingData.news.length + pendingData.shares.length}
                </div>
                <div className="text-sm text-gray-500">待审核总数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pendingData.news.length}
                </div>
                <div className="text-sm text-gray-500">待审核新闻</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {pendingData.shares.length}
                </div>
                <div className="text-sm text-gray-500">待审核分享</div>
              </CardContent>
            </Card>
          </div>

          {/* 审核内容 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="news" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                新闻 ({pendingData.news.length})
              </TabsTrigger>
              <TabsTrigger value="shares" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                分享 ({pendingData.shares.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : (
                renderSubmissionTable(pendingData.news, 'news')
              )}
            </TabsContent>

            <TabsContent value="shares" className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : (
                renderSubmissionTable(pendingData.shares, 'share')
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}