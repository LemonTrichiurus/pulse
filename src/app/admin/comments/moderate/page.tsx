'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Check, 
  X, 
  Eye, 
  AlertCircle, 
  Clock,
  MessageSquare,
  ArrowLeft,
  Search
} from 'lucide-react'
import { getCurrentUser, isAdminOrMod, supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Comment {
  id: string
  body_rich: string
  created_at: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  author: {
    id: string
    display_name: string
    email: string
  }
  topic: {
    id: string
    title: string
  }
  moderated_by?: string
  moderated_at?: string
  reason?: string
}

export default function CommentModerationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [commentToReject, setCommentToReject] = useState<string | null>(null)
  const [moderating, setModerating] = useState<string | null>(null)

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    filterComments()
  }, [comments, searchTerm, statusFilter])

  const checkPermissions = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      const permission = await isAdminOrMod(currentUser.id)
      if (!permission) {
        router.push('/')
        return
      }

      setUser(currentUser)
      await loadComments()
    } catch (error) {
      console.error('权限检查失败:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch('/api/comments')
      if (response.ok) {
        const data = await response.json()
        setComments(data.data || [])
      } else {
        toast.error('加载评论失败')
      }
    } catch (error) {
      console.error('加载评论失败:', error)
      toast.error('加载评论失败')
    }
  }

  const filterComments = () => {
    let filtered = comments

    // 状态筛选
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(comment => comment.status === statusFilter)
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(comment => 
        comment.body_rich.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.topic.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredComments(filtered)
  }

  const handleApprove = async (commentId: string) => {
    setModerating(commentId)
    try {
      // 获取认证令牌
      const { data: sessionData } = await supabase!.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        toast.error('登录状态已失效，请重新登录后再试')
        setModerating(null)
        return
      }

      const response = await fetch('/api/comments/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          comment_id: commentId,
          status: 'APPROVED'
        })
      })

      if (response.ok) {
        toast.success('评论已通过审核')
        await loadComments()
      } else {
        const error = await response.json()
        toast.error(error.error || '审核失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('审核失败')
    } finally {
      setModerating(null)
    }
  }

  const handleReject = async () => {
    if (!commentToReject || !rejectReason.trim()) {
      toast.error('请填写拒绝原因')
      return
    }

    setModerating(commentToReject)
    try {
      // 获取认证令牌
      const { data: sessionData } = await supabase!.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        toast.error('登录状态已失效，请重新登录后再试')
        setModerating(null)
        return
      }

      const response = await fetch('/api/comments/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          comment_id: commentToReject,
          status: 'REJECTED',
          reason: rejectReason
        })
      })

      if (response.ok) {
        toast.success('评论已拒绝')
        await loadComments()
        setRejectDialogOpen(false)
        setRejectReason('')
        setCommentToReject(null)
      } else {
        const error = await response.json()
        toast.error(error.error || '审核失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('审核失败')
    } finally {
      setModerating(null)
    }
  }

  const openRejectDialog = (commentId: string) => {
    setCommentToReject(commentId)
    setRejectDialogOpen(true)
  }

  const viewCommentDetail = (comment: Comment) => {
    setSelectedComment(comment)
    setDetailDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">待审核</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">已通过</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600">已拒绝</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const pendingCount = comments.filter(c => c.status === 'PENDING').length
  const approvedCount = comments.filter(c => c.status === 'APPROVED').length
  const rejectedCount = comments.filter(c => c.status === 'REJECTED').length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回管理后台
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">评论审核队列</h1>
          <p className="text-muted-foreground">
            管理和审核用户评论
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">需要处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">审核通过</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">审核拒绝</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索评论内容、作者或话题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <div className="space-y-4">
        {filteredComments.length > 0 ? (
          filteredComments.map((comment) => (
            <Card key={comment.id} className={comment.status === 'PENDING' ? 'border-orange-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(comment.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <div className="font-medium">{comment.author.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      话题: {comment.topic.title}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm line-clamp-3">
                    {comment.body_rich.replace(/<[^>]*>/g, '')}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewCommentDetail(comment)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      查看详情
                    </Button>
                    
                    {comment.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(comment.id)}
                          disabled={moderating === comment.id}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          通过
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openRejectDialog(comment.id)}
                          disabled={moderating === comment.id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          拒绝
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {comment.status !== 'PENDING' && comment.moderated_at && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      审核时间: {formatDate(comment.moderated_at)}
                      {comment.reason && ` • 原因: ${comment.reason}`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">暂无评论</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'ALL' ? '没有符合条件的评论' : '还没有评论需要审核'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 评论详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>评论详情</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">作者:</span> {selectedComment.author.display_name}
                </div>
                <div>
                  <span className="font-medium">状态:</span> {getStatusBadge(selectedComment.status)}
                </div>
                <div>
                  <span className="font-medium">提交时间:</span> {formatDate(selectedComment.created_at)}
                </div>
                <div>
                  <span className="font-medium">话题:</span> {selectedComment.topic.title}
                </div>
              </div>
              
              <div>
                <span className="font-medium">评论内容:</span>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <div dangerouslySetInnerHTML={{ __html: selectedComment.body_rich }} />
                </div>
              </div>
              
              {selectedComment.status !== 'PENDING' && selectedComment.moderated_at && (
                <div className="text-sm">
                  <span className="font-medium">审核信息:</span>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <div>审核时间: {formatDate(selectedComment.moderated_at)}</div>
                    {selectedComment.reason && <div>拒绝原因: {selectedComment.reason}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 拒绝评论对话框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝评论</DialogTitle>
            <DialogDescription>
              请说明拒绝这条评论的原因
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="请输入拒绝原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setRejectDialogOpen(false)
                  setRejectReason('')
                  setCommentToReject(null)
                }}
              >
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim() || moderating === commentToReject}
              >
                确认拒绝
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}