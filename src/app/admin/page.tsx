'use client'

import { useState, useEffect } from 'react'
import { Shield, MessageSquare, Users, FileText, Eye, Check, X, Search, Filter, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// 模拟待审核留言数据
const mockPendingMessages = [
  {
    id: '1',
    content: '这周的话题很有意思，我觉得可以从多个角度来讨论这个问题。希望大家都能积极参与！',
    author: '张同学',
    submittedAt: '2024-01-15T14:30:00Z',
    status: 'pending' as const,
    topic: '本周话题：如何平衡学习和兴趣爱好？',
    likes: 0,
    reports: 0
  },
  {
    id: '2',
    content: '我认为学校的食堂菜品需要改进，希望能增加更多健康的选择。另外，价格也可以更合理一些。',
    author: '李同学',
    submittedAt: '2024-01-15T16:45:00Z',
    status: 'pending' as const,
    topic: '本周话题：如何平衡学习和兴趣爱好？',
    likes: 0,
    reports: 1
  },
  {
    id: '3',
    content: '建议学校图书馆延长开放时间，特别是在考试期间。现在的开放时间对于需要复习的同学来说有点短。',
    author: '王同学',
    submittedAt: '2024-01-15T18:20:00Z',
    status: 'pending' as const,
    topic: '本周话题：如何平衡学习和兴趣爱好？',
    likes: 0,
    reports: 0
  },
  {
    id: '4',
    content: '这个话题让我想到了时间管理的重要性。我觉得制定合理的计划是关键，既要保证学习效果，也要留出时间发展兴趣。',
    author: '赵同学',
    submittedAt: '2024-01-15T20:10:00Z',
    status: 'pending' as const,
    topic: '本周话题：如何平衡学习和兴趣爱好？',
    likes: 0,
    reports: 0
  }
]

// 模拟已审核留言数据
const mockReviewedMessages = [
  {
    id: '5',
    content: '感谢学校组织这样的讨论活动，让我们有机会表达自己的想法和建议。',
    author: '陈同学',
    submittedAt: '2024-01-14T10:15:00Z',
    reviewedAt: '2024-01-14T11:00:00Z',
    status: 'approved' as const,
    topic: '上周话题：对学校活动的建议',
    likes: 15,
    reports: 0,
    reviewer: '管理员A'
  },
  {
    id: '6',
    content: '希望学校能够增加更多的社团活动，丰富我们的课余生活。',
    author: '刘同学',
    submittedAt: '2024-01-14T14:30:00Z',
    reviewedAt: '2024-01-14T15:20:00Z',
    status: 'approved' as const,
    topic: '上周话题：对学校活动的建议',
    likes: 8,
    reports: 0,
    reviewer: '管理员B'
  },
  {
    id: '7',
    content: '不当言论示例（已被拒绝）',
    author: '某用户',
    submittedAt: '2024-01-13T16:45:00Z',
    reviewedAt: '2024-01-13T17:00:00Z',
    status: 'rejected' as const,
    topic: '上周话题：对学校活动的建议',
    likes: 0,
    reports: 3,
    reviewer: '管理员A',
    rejectReason: '内容不当，违反社区规范'
  }
]

interface Message {
  id: string
  content: string
  author: string
  submittedAt: string
  reviewedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  topic: string
  likes: number
  reports: number
  reviewer?: string
  rejectReason?: string
}

function MessageCard({ message, onApprove, onReject, onView }: {
  message: Message
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  onView: (message: Message) => void
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { name: '待审核', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
      case 'approved':
        return { name: '已通过', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
      case 'rejected':
        return { name: '已拒绝', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
      default:
        return { name: '未知', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    }
  }

  const statusInfo = getStatusInfo(message.status)
  const isUrgent = message.reports > 0

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('请填写拒绝原因')
      return
    }
    onReject?.(message.id, rejectReason)
    setRejectReason('')
    setRejectDialogOpen(false)
  }

  return (
    <Card className={`${isUrgent ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>
              {statusInfo.name}
            </Badge>
            {isUrgent && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                {message.reports} 举报
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(message.submittedAt).toLocaleString('zh-CN')}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{message.author}</div>
            <div className="text-sm text-muted-foreground">{message.topic}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm line-clamp-3">{message.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{message.likes} 点赞</span>
              <span>{message.reports} 举报</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(message)}>
                <Eye className="w-4 h-4 mr-1" />
                查看
              </Button>
              
              {message.status === 'pending' && onApprove && (
                <Button size="sm" onClick={() => onApprove(message.id)}>
                  <Check className="w-4 h-4 mr-1" />
                  通过
                </Button>
              )}
              
              {message.status === 'pending' && onReject && (
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      拒绝
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>拒绝留言</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">拒绝原因</label>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="请说明拒绝的原因..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                          取消
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                          确认拒绝
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {message.status !== 'pending' && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {message.status === 'approved' ? '通过' : '拒绝'}时间: {message.reviewedAt && new Date(message.reviewedAt).toLocaleString('zh-CN')}
              {message.reviewer && ` • 审核人: ${message.reviewer}`}
              {message.rejectReason && ` • 原因: ${message.rejectReason}`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MessageDetailDialog({ message, open, onOpenChange }: {
  message: Message | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!message) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>留言详情</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">作者:</span> {message.author}
            </div>
            <div>
              <span className="font-medium">状态:</span> 
              <Badge className="ml-2">
                {message.status === 'pending' ? '待审核' : 
                 message.status === 'approved' ? '已通过' : '已拒绝'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">提交时间:</span> {new Date(message.submittedAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="font-medium">话题:</span> {message.topic}
            </div>
          </div>
          
          <div>
            <span className="font-medium">内容:</span>
            <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {message.content}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">点赞数:</span> {message.likes}
            </div>
            <div>
              <span className="font-medium">举报数:</span> {message.reports}
            </div>
          </div>
          
          {message.status !== 'pending' && (
            <div className="text-sm">
              <span className="font-medium">审核信息:</span>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>审核时间: {message.reviewedAt && new Date(message.reviewedAt).toLocaleString('zh-CN')}</div>
                {message.reviewer && <div>审核人: {message.reviewer}</div>}
                {message.rejectReason && <div>拒绝原因: {message.rejectReason}</div>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminPage() {
  const [pendingMessages, setPendingMessages] = useState(mockPendingMessages)
  const [reviewedMessages, setReviewedMessages] = useState(mockReviewedMessages)
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const handleApprove = (id: string) => {
    const message = pendingMessages.find(m => m.id === id)
    if (message) {
      const approvedMessage = {
        ...message,
        status: 'approved' as const,
        reviewedAt: new Date().toISOString(),
        reviewer: '当前管理员'
      }
      setReviewedMessages([approvedMessage, ...reviewedMessages])
      setPendingMessages(pendingMessages.filter(m => m.id !== id))
      toast.success('留言已通过审核')
    }
  }

  const handleReject = (id: string, reason: string) => {
    const message = pendingMessages.find(m => m.id === id)
    if (message) {
      const rejectedMessage = {
        ...message,
        status: 'rejected' as const,
        reviewedAt: new Date().toISOString(),
        reviewer: '当前管理员',
        rejectReason: reason
      }
      setReviewedMessages([rejectedMessage, ...reviewedMessages])
      setPendingMessages(pendingMessages.filter(m => m.id !== id))
      toast.success('留言已拒绝')
    }
  }

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message)
    setDetailDialogOpen(true)
  }

  const filteredReviewedMessages = reviewedMessages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredPendingMessages = pendingMessages.filter(message => {
    return message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           message.author.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const urgentMessages = pendingMessages.filter(m => m.reports > 0)
  const totalPending = pendingMessages.length
  const totalApproved = reviewedMessages.filter(m => m.status === 'approved').length
  const totalRejected = reviewedMessages.filter(m => m.status === 'rejected').length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-blue-500" />
          后台管理系统
        </h1>
        <p className="text-lg text-muted-foreground">
          留言审核与内容管理
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
                <div className="text-sm text-muted-foreground">待审核</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{totalApproved}</div>
                <div className="text-sm text-muted-foreground">已通过</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
                <div className="text-sm text-muted-foreground">已拒绝</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{urgentMessages.length}</div>
                <div className="text-sm text-muted-foreground">紧急处理</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
        >
          待审核 ({totalPending})
        </Button>
        <Button 
          variant={activeTab === 'reviewed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reviewed')}
        >
          已审核 ({totalApproved + totalRejected})
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="搜索留言内容或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {activeTab === 'reviewed' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="rejected">已拒绝</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 留言列表 */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          filteredPendingMessages.length > 0 ? (
            filteredPendingMessages.map(message => (
              <MessageCard
                key={message.id}
                message={message}
                onApprove={handleApprove}
                onReject={handleReject}
                onView={handleViewMessage}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无待审核留言</p>
                <p>所有留言都已处理完毕</p>
              </div>
            </Card>
          )
        ) : (
          filteredReviewedMessages.length > 0 ? (
            filteredReviewedMessages.map(message => (
              <MessageCard
                key={message.id}
                message={message}
                onView={handleViewMessage}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无相关记录</p>
                <p>试试调整搜索条件</p>
              </div>
            </Card>
          )
        )}
      </div>

      {/* 留言详情对话框 */}
      <MessageDetailDialog
        message={selectedMessage}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  )
}