'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Eye, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
// 移除认证相关导入
import { isSupabaseReady } from '@/lib/supabase'

// 模拟新闻数据
const mockNews = [
  {
    id: '1',
    title: '学校举办第十届科技创新大赛',
    subtitle: '展示学生创新能力，推动科技教育发展',
    excerpt: '本次大赛吸引了全校500多名学生参与，涵盖人工智能、机器人、环保科技等多个领域...',
    category: 'campus' as const,
    tags: ['科技', '创新', '比赛'],
    author: '新闻中心',
    published_at: '2024-01-15T10:00:00Z',
    view_count: 1250,
    comment_count: 23,
    featured_image: '/images/tech-competition.jpg',
    is_featured: true
  },
  {
    id: '2',
    title: 'AI技术在教育领域的最新应用',
    subtitle: '探索人工智能如何改变传统教学模式',
    excerpt: '随着ChatGPT等AI工具的普及，教育行业正在经历前所未有的变革...',
    category: 'ai' as const,
    tags: ['AI', '教育', '技术'],
    author: '科技部',
    published_at: '2024-01-14T15:30:00Z',
    view_count: 890,
    comment_count: 15,
    featured_image: '/images/ai-education.jpg',
    is_featured: false
  },
  {
    id: '3',
    title: '全球气候变化对青年一代的影响',
    subtitle: '联合国最新报告解读',
    excerpt: '联合国最新发布的气候变化报告显示，青年一代将面临更严峻的环境挑战...',
    category: 'global' as const,
    tags: ['环境', '气候', '全球'],
    author: '国际部',
    published_at: '2024-01-13T09:15:00Z',
    view_count: 567,
    comment_count: 8,
    featured_image: '/images/climate-change.jpg',
    is_featured: false
  }
]

const categories = [
  { value: 'all', label: '全部', count: mockNews.length },
  { value: 'campus', label: '校园', count: mockNews.filter(n => n.category === 'campus').length },
  { value: 'global', label: '全球', count: mockNews.filter(n => n.category === 'global').length },
  { value: 'ai', label: 'AI科技', count: mockNews.filter(n => n.category === 'ai').length },
  { value: 'other', label: '其他', count: mockNews.filter(n => n.category === 'other').length }
]

function NewsCard({ news }: { news: typeof mockNews[0] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${news.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative">
        {news.featured_image && (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <Image
              src={news.featured_image}
              alt={news.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // 如果图片加载失败，显示占位符
                e.currentTarget.style.display = 'none'
              }}
            />
            {news.is_featured && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                精选
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={getCategoryColor(news.category)}>
            {categories.find(c => c.value === news.category)?.label}
          </Badge>
          {news.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <CardTitle className="line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link href={`/news/${news.id}`}>
            {news.title}
          </Link>
        </CardTitle>
        
        {news.subtitle && (
          <p className="text-sm text-muted-foreground font-medium">
            {news.subtitle}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {news.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(news.published_at)}
            </span>
            <span>by {news.author}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {news.view_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {news.comment_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NewsPage() {
  // 移除认证相关逻辑
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
    // 临时用户占位，未连接认证
  const user = null

  const [filteredNews, setFilteredNews] = useState(mockNews)

  useEffect(() => {
    let filtered = mockNews

    // 分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(news => news.category === selectedCategory)
    }

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(news => 
        news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredNews(filtered)
  }, [searchQuery, selectedCategory])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">新闻中心</h1>
        <p className="text-muted-foreground">
          了解校园最新动态，关注全球热点资讯
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜索新闻标题、内容或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

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
      </div>

      {/* 新闻列表 */}
      <div className="space-y-6">
        {/* 精选新闻 */}
        {selectedCategory === 'all' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge className="bg-red-500 text-white">精选</Badge>
              今日推荐
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockNews.filter(news => news.is_featured).map(news => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>
        )}

        {/* 所有新闻 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory === 'all' ? '最新新闻' : `${categories.find(c => c.value === selectedCategory)?.label}新闻`}
            </h2>
            <p className="text-sm text-muted-foreground">
              共 {filteredNews.length} 篇文章
            </p>
          </div>

          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(news => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">没有找到相关新闻</p>
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
      </div>

      {/* 投稿提示 */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <h3 className="font-semibold mb-2">想要分享你的故事？</h3>
        <p className="text-sm text-muted-foreground mb-4">
          欢迎向新闻中心投稿，分享校园生活、学习心得或关注的话题。
        </p>
        <Link href="/submit">
          <Button size="sm">
            立即投稿
          </Button>
        </Link>
      </div>
    </div>
  )
}
