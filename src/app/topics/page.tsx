'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, MessageCircle, Heart, Pin, Lock, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
// 移除认证相关导入
import { toast } from 'sonner'

// 模拟话题数据
const mockTopics = [
  {
    id: '1',
    title: '关于期末考试复习方法的讨论',
    content: '马上就要期末考试了，大家都是怎么复习的？有什么好的方法可以分享一下吗？特别是数学和物理这两门课...',
    category: 'academic' as const,
    tags: ['考试', '复习', '学习方法'],
    author: {
      id: 'user1',
      name: '张同学',
      role: 'member' as const
    },
    is_pinned: false,
    is_locked: false,
    view_count: 234,
    like_count: 45,
    comment_count: 18,
    last_activity_at: '2024-01-15T16:30:00Z',
    created_at: '2024-01-14T09:00:00Z'
  },
  {
    id: '2',
    title: '学校食堂新菜品推荐',
    content: '今天发现食堂二楼新推出了几道菜，味道还不错！特别推荐红烧肉和酸菜鱼，价格也很实惠。大家有什么其他推荐的吗？',
    category: 'life' as const,
    tags: ['食堂', '美食', '推荐'],
    author: {
      id: 'user2',
      name: '李同学',
      role: 'member' as const
    },
    is_pinned: true,
    is_locked: false,
    view_count: 189,
    like_count: 32,
    comment_count: 25,
    last_activity_at: '2024-01-15T14:20:00Z',
    created_at: '2024-01-13T12:30:00Z'
  },
  {
    id: '3',
    title: '编程社团招新啦！',
    content: '我们编程社团正在招募新成员，欢迎对编程感兴趣的同学加入！不管你是零基础还是有经验，我们都欢迎。社团会定期举办技术分享会和编程比赛。',
    category: 'tech' as const,
    tags: ['社团', '编程', '招新'],
    author: {
      id: 'user3',
      name: '王同学',
      role: 'moderator' as const
    },
    is_pinned: false,
    is_locked: false,
    view_count: 156,
    like_count: 28,
    comment_count: 12,
    last_activity_at: '2024-01-15T11:45:00Z',
    created_at: '2024-01-12T15:00:00Z'
  },
  {
    id: '4',
    title: '关于校园环保的建议',
    content: '最近注意到校园里垃圾分类做得不够好，想和大家讨论一下如何改善这个问题。我觉得可以从以下几个方面入手...',
    category: 'general' as const,
    tags: ['环保', '校园', '建议'],
    author: {
      id: 'user4',
      name: '赵同学',
      role: 'member' as const
    },
    is_pinned: false,
    is_locked: false,
    view_count: 98,
    like_count: 15,
    comment_count: 8,
    last_activity_at: '2024-01-15T10:15:00Z',
    created_at: '2024-01-11T14:20:00Z'
  }
]

const categories = [
  { value: 'all', label: '全部', count: mockTopics.length },
  { value: 'general', label: '综合讨论', count: mockTopics.filter(t => t.category === 'general').length },
  { value: 'academic', label: '学习交流', count: mockTopics.filter(t => t.category === 'academic').length },
  { value: 'life', label: '校园生活', count: mockTopics.filter(t => t.category === 'life').length },
  { value: 'tech', label: '科技数码', count: mockTopics.filter(t => t.category === 'tech').length },
  { value: 'other', label: '其他', count: mockTopics.filter(t => t.category === 'other').length }
]

const sortOptions = [
  { value: 'latest', label: '最新回复', icon: Clock },
  { value: 'popular', label: '最多回复', icon: MessageCircle },
  { value: 'trending', label: '最多点赞', icon: TrendingUp }
]

function TopicCard({ topic }: { topic: typeof mockTopics[0] }) {
  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours}小时前`
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}天前`
    return date.toLocaleDateString('zh-CN')
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {/* 左侧图标区域 */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {topic.author.name.charAt(0)}
            </div>
            <div className="flex flex-col items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {topic.comment_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {topic.like_count}
              </span>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 min-w-0">
            {/* 标题和状态 */}
            <div className="flex items-start gap-2 mb-2">
              <div className="flex items-center gap-1">
                {topic.is_pinned && (
                  <Pin className="w-4 h-4 text-red-500" />
                )}
                {topic.is_locked && (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <Link href={`/topics/${topic.id}`} className="flex-1">
                <h3 className="font-semibold group-hover:text-blue-600 transition-colors line-clamp-2">
                  {topic.title}
                </h3>
              </Link>
            </div>

            {/* 内容预览 */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {topic.content}
            </p>

            {/* 标签和分类 */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getCategoryColor(topic.category)}>
                {categories.find(c => c.value === topic.category)?.label}
              </Badge>
              {topic.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{topic.author.name}</span>
                <Badge className={getRoleColor(topic.author.role)} variant="outline">
                  {topic.author.role === 'admin' ? '管理员' : 
                   topic.author.role === 'moderator' ? '版主' : '学生'}
                </Badge>
                <span>发布于 {formatDate(topic.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{topic.view_count} 浏览</span>
                <span>最后回复 {formatDate(topic.last_activity_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateTopicDialog() {
  // 移除认证相关逻辑
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [tags, setTags] = useState('')

  const handleSubmit = () => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    if (!title.trim() || !content.trim()) {
      toast.error('标题和内容不能为空')
      return
    }

    // 这里应该调用API创建话题
    toast.success('话题发布成功！')
    setOpen(false)
    setTitle('')
    setContent('')
    setCategory('general')
    setTags('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          发起话题
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>发起新话题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">话题标题</Label>
            <Input
              id="title"
              placeholder="请输入话题标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {categories.slice(1).map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="content">话题内容</Label>
            <Textarea
              id="content"
              placeholder="详细描述你的话题..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
          
          <div>
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              placeholder="用逗号分隔多个标签，如：学习,考试,方法"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              发布话题
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TopicsPage() {
  // 移除认证相关逻辑
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [filteredTopics, setFilteredTopics] = useState(mockTopics)

  useEffect(() => {
    let filtered = [...mockTopics]

    // 分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(topic => topic.category === selectedCategory)
    }

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.comment_count - a.comment_count)
        break
      case 'trending':
        filtered.sort((a, b) => b.like_count - a.like_count)
        break
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
        break
    }

    // 置顶话题排在前面
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    })

    setFilteredTopics(filtered)
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">话题广场</h1>
          <p className="text-muted-foreground">
            分享想法，交流观点，共同成长
          </p>
        </div>
        <CreateTopicDialog />
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜索话题标题、内容或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center gap-2"
              >
                <Filter className="w-3 h-3" />
                {category.label}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* 排序选项 */}
          <div className="flex gap-2">
            {sortOptions.map(option => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(option.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-3 h-3" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="space-y-4">
        {filteredTopics.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                共 {filteredTopics.length} 个话题
              </p>
            </div>
            
            {filteredTopics.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">没有找到相关话题</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
            >
              清除筛选条件
            </Button>
          </div>
        )}
      </div>

      {/* 社区规则提示 */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h3 className="font-semibold mb-2">社区讨论规则</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 保持友善和尊重，理性讨论</li>
          <li>• 发布有价值的内容，避免灌水</li>
          <li>• 使用合适的分类和标签</li>
          <li>• 遵守校园网络使用规范</li>
        </ul>
      </div>
    </div>
  )
}