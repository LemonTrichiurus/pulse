'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Eye, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

// 新闻数据类型定义
interface NewsItem {
  id: string
  title: string
  content_rich?: string
  cover_url?: string
  category: 'CAMPUS' | 'GLOBAL'
  status: 'PUBLISHED' | 'DRAFT'
  author_id: string
  published_at?: string
  created_at: string
  updated_at: string
  view_count?: number
  comment_count?: number
  is_featured?: boolean
  tags?: string[]
  excerpt?: string
  author?: {
    display_name: string
  }
}

// 分类定义
const getCategories = (news: NewsItem[]) => [
  { value: 'all', label: '全部', count: news.length },
  { value: 'CAMPUS', label: '校园', count: news.filter(n => n.category === 'CAMPUS').length },
  { value: 'GLOBAL', label: '全球', count: news.filter(n => n.category === 'GLOBAL').length }
]

function NewsCard({ news }: { news: NewsItem }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CAMPUS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'GLOBAL': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'CAMPUS': return '校园'
      case 'GLOBAL': return '全球'
      default: return '其他'
    }
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${news.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative">
        {news.cover_url && (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <Image
              src={news.cover_url}
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
            {getCategoryLabel(news.category)}
          </Badge>
          {news.tags && news.tags.map(tag => (
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
        
        {news.excerpt && (
          <p className="text-sm text-muted-foreground font-medium line-clamp-2">
            {news.excerpt}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(news.published_at || news.created_at)}
            </span>
            <span>by {news.author?.display_name || '匿名'}</span>
          </div>
          
          {/* 阅读数量和评论数量已隐藏 */}
        </div>
      </CardContent>
    </Card>
  )
}

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 获取新闻数据
  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/news?status=PUBLISHED&limit=50')
      if (!response.ok) {
        throw new Error('获取新闻失败')
      }
      const data = await response.json()
      setNews(data.data || [])
    } catch (error: any) {
      console.error('获取新闻失败:', error)
      setError(error.message || '获取新闻失败')
      toast.error('获取新闻失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载数据
  useEffect(() => {
    fetchNews()
  }, [])

  // 筛选和搜索逻辑
  useEffect(() => {
    let filtered = news

    // 分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredNews(filtered)
  }, [searchQuery, selectedCategory, news])

  const categories = getCategories(news)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载新闻中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchNews} variant="outline">
            重新加载
          </Button>
        </div>
      </div>
    )
  }

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
        {selectedCategory === 'all' && news.filter(item => item.is_featured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge className="bg-red-500 text-white">精选</Badge>
              今日推荐
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {news.filter(item => item.is_featured).map(item => (
                <NewsCard key={item.id} news={item} />
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
              {filteredNews.map(item => (
                <NewsCard key={item.id} news={item} />
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
