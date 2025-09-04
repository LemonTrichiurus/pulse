'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Eye, MessageCircle, Share2, Heart, Bookmark, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import Image from 'next/image'
// 移除认证相关导入
import { toast } from 'sonner'

// 模拟新闻详情数据
const mockNewsDetail = {
  id: '1',
  title: '学校举办第十届科技创新大赛',
  subtitle: '展示学生创新能力，推动科技教育发展',
  content: `
<p>2024年1月15日，我校第十届科技创新大赛在科技楼隆重举行。本次大赛以"创新引领未来"为主题，吸引了全校500多名学生参与，涵盖人工智能、机器人、环保科技、生物医学等多个前沿领域。</p>

<h2>大赛亮点</h2>
<p>本届大赛呈现出以下几个突出特点：</p>
<ul>
<li><strong>参与面广：</strong>来自高一到高三各年级的学生踊跃参与，共提交作品312件</li>
<li><strong>创新性强：</strong>多个项目展现了学生对前沿科技的深入思考和创新应用</li>
<li><strong>实用价值高：</strong>许多作品针对现实问题提出了切实可行的解决方案</li>
</ul>

<h2>获奖作品展示</h2>
<p>经过激烈角逐，以下作品脱颖而出：</p>

<h3>一等奖：智能垃圾分类系统</h3>
<p>高二(3)班张同学团队开发的智能垃圾分类系统，运用计算机视觉技术，能够自动识别并分类各种垃圾，准确率达到95%以上。该系统已在学校食堂试点运行，效果显著。</p>

<h3>二等奖：基于AI的学习助手</h3>
<p>高三(1)班李同学设计的学习助手应用，能够根据学生的学习习惯和知识掌握情况，智能推荐学习内容和制定复习计划，帮助同学们提高学习效率。</p>

<h2>专家点评</h2>
<p>担任本次大赛评委的清华大学计算机系教授王老师表示："这些作品展现了当代中学生优秀的创新思维和实践能力。特别是在人工智能、环保科技等领域，学生们的想法非常前瞻，有些甚至达到了大学生的水平。"</p>

<h2>展望未来</h2>
<p>学校科技部主任表示，科技创新大赛不仅是展示学生才华的平台，更是培养创新精神的重要途径。学校将继续加大对科技教育的投入，为学生提供更多实践机会，培养更多具有创新精神的优秀人才。</p>

<p>据悉，获奖作品将推荐参加市级、省级科技创新大赛，优秀项目还将获得专利申请支持。</p>
  `,
  category: 'campus' as const,
  tags: ['科技', '创新', '比赛', '教育'],
  author: {
    id: 'author1',
    name: '新闻中心',
    avatar: '/images/news-center-avatar.jpg',
    role: 'admin' as const
  },
  published_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  view_count: 1250,
  like_count: 89,
  comment_count: 23,
  featured_image: '/images/tech-competition.jpg',
  is_featured: true,
  is_liked: false,
  is_bookmarked: false
}

// 模拟评论数据
const mockComments = [
  {
    id: '1',
    content: '这次比赛真的很精彩！看到同学们的创新作品，感觉很受启发。希望学校能多举办这样的活动。',
    author: {
      id: 'user1',
      name: '张同学',
      avatar: '/images/student-avatar-1.jpg',
      role: 'member' as const
    },
    created_at: '2024-01-15T14:30:00Z',
    like_count: 12,
    is_liked: false
  },
  {
    id: '2',
    content: '智能垃圾分类系统确实很厉害，我也想学习相关技术。请问有推荐的学习资源吗？',
    author: {
      id: 'user2',
      name: '李同学',
      avatar: '/images/student-avatar-2.jpg',
      role: 'member' as const
    },
    created_at: '2024-01-15T16:45:00Z',
    like_count: 8,
    is_liked: true
  },
  {
    id: '3',
    content: '作为参赛选手，感谢学校提供这样的平台。虽然没有获奖，但收获很大，明年继续努力！',
    author: {
      id: 'user3',
      name: '王同学',
      avatar: '/images/student-avatar-3.jpg',
      role: 'member' as const
    },
    created_at: '2024-01-16T09:20:00Z',
    like_count: 15,
    is_liked: false
  }
]

// 相关新闻
const relatedNews = [
  {
    id: '2',
    title: 'AI技术在教育领域的最新应用',
    excerpt: '随着ChatGPT等AI工具的普及，教育行业正在经历前所未有的变革...',
    published_at: '2024-01-14T15:30:00Z',
    view_count: 890
  },
  {
    id: '4',
    title: '学生创新项目获得国家专利',
    excerpt: '我校高三学生发明的智能节水装置获得国家实用新型专利...',
    published_at: '2024-01-12T11:00:00Z',
    view_count: 654
  }
]

function CommentItem({ comment }: { comment: typeof mockComments[0] }) {
  const [isLiked, setIsLiked] = useState(comment.is_liked)
  const [likeCount, setLikeCount] = useState(comment.like_count)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <Badge variant="outline" className="text-xs">
              {comment.author.role === 'admin' ? '管理员' : 
               comment.author.role === 'moderator' ? '版主' : '学生'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-6 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
              回复
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewsDetailPage() {
  const params = useParams()
  // 移除认证相关逻辑
  const [news, setNews] = useState(mockNewsDetail)
  const [comments, setComments] = useState(mockComments)
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(news.is_liked)
  const [isBookmarked, setIsBookmarked] = useState(news.is_bookmarked)
  const [likeCount, setLikeCount] = useState(news.like_count)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'campus': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'global': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'ai': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? '取消收藏' : '收藏成功')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.subtitle,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }

  const handleSubmitComment = () => {
    if (!user) {
      toast.error('请先登录后再评论')
      return
    }
    
    if (!newComment.trim()) {
      toast.error('评论内容不能为空')
      return
    }

    const comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        id: user.id,
        name: '我',
        avatar: '/images/default-avatar.jpg',
        role: 'member' as const
      },
      created_at: new Date().toISOString(),
      like_count: 0,
      is_liked: false
    }

    setComments([comment, ...comments])
    setNewComment('')
    toast.success('评论发布成功')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/news">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回新闻列表
          </Button>
        </Link>
      </div>

      {/* 文章头部 */}
      <article className="mb-8">
        {/* 标题区域 */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={getCategoryColor(news.category)}>
              校园
            </Badge>
            {news.is_featured && (
              <Badge className="bg-red-500 text-white">
                精选
              </Badge>
            )}
            {news.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{news.title}</h1>
          {news.subtitle && (
            <p className="text-xl text-muted-foreground mb-4">{news.subtitle}</p>
          )}
          
          {/* 文章信息 */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{news.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(news.published_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{news.view_count} 阅读</span>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={isBookmarked ? 'text-yellow-500' : ''}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* 特色图片 */}
        {news.featured_image && (
          <div className="mb-8">
            <div className="aspect-video relative overflow-hidden rounded-lg">
              <Image
                src={news.featured_image}
                alt={news.title}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* 文章内容 */}
        <div 
          className="prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </article>

      {/* 评论区 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5" />
          <h2 className="text-xl font-semibold">评论 ({comments.length})</h2>
        </div>

        {/* 发表评论 */}
        {user ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                placeholder="写下你的想法..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmitComment}>
                  发表评论
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">登录后即可参与评论讨论</p>
              <Button>登录</Button>
            </CardContent>
          </Card>
        )}

        {/* 评论列表 */}
        <Card>
          <CardContent className="pt-6">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无评论，快来发表第一条评论吧！
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 相关推荐 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">相关推荐</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatedNews.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <Link href={`/news/${item.id}`}>
                  <h3 className="font-medium mb-2 hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.published_at).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.view_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}