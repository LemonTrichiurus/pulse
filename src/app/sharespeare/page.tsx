'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Eye, MessageCircle, Heart, Calendar, User, GraduationCap, Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

// 辅助函数
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 定义数据类型
interface SharespeareItem {
  id: string
  title: string
  content_rich: string
  media_url: string | null
  media_urls: string[] | null
  author_id: string
  published_at: string | null
  status: 'DRAFT' | 'PUBLISHED'
  created_at: string
  updated_at: string
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface ApiResponse {
  data: SharespeareItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 动态分类数据，基于数据库内容生成
function generateCategoriesFromShares(shares: SharespeareItem[]) {
  const categories = [
    {
      id: 'academic',
      name: '学术经验',
      description: '学习方法、学术研究、升学经验分享',
      icon: '🎓',
      articles: shares.filter(share => 
        share.title.includes('学习') || share.title.includes('学术') || 
        share.title.includes('升学') || share.title.includes('考试')
      ).slice(0, 3)
    },
    {
      id: 'career',
      name: '职业发展',
      description: '实习经验、求职技巧、职业规划分享',
      icon: '💼',
      articles: shares.filter(share => 
        share.title.includes('实习') || share.title.includes('工作') || 
        share.title.includes('职业') || share.title.includes('求职')
      ).slice(0, 3)
    },
    {
      id: 'study_abroad',
      name: '留学申请',
      description: '留学准备、申请经验、海外生活分享',
      icon: '✈️',
      articles: shares.filter(share => 
        share.title.includes('留学') || share.title.includes('申请') || 
        share.title.includes('出国') || share.title.includes('海外')
      ).slice(0, 3)
    },
    {
      id: 'entrepreneurship',
      name: '创业创新',
      description: '创业经历、创新项目、商业思维分享',
      icon: '🚀',
      articles: shares.filter(share => 
        share.title.includes('创业') || share.title.includes('创新') || 
        share.title.includes('项目') || share.title.includes('商业')
      ).slice(0, 3)
    }
  ]
  
  return categories.filter(category => category.articles.length > 0)
}

function ShareCard({ share }: { share: SharespeareItem }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    })
  }

  const categoryInfo = { name: '经验分享', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }

  return (
    <Link href={`/sharespeare/${share.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={categoryInfo.color}>
                {categoryInfo.name}
              </Badge>
              {share.published_at && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  已发布
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(share.created_at)}
            </span>
          </div>
          
          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
            {share.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div 
            className="text-muted-foreground mb-4 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: share.content_rich.substring(0, 200) + '...' }}
          />
          
          {/* 媒体预览 */}
          {(share.media_url || (share.media_urls && share.media_urls.length > 0)) && (
            <div className="mb-4">
              {/* 单张图片预览 */}
              {share.media_url && !share.media_urls && (
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={share.media_url}
                    alt="文章配图"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              
              {/* 多张图片预览 */}
              {share.media_urls && share.media_urls.length > 0 && (
                <div className="relative">
                  <div className={`grid gap-1 ${
                    share.media_urls.length === 1 ? 'grid-cols-1' :
                    share.media_urls.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {share.media_urls.slice(0, 3).map((url, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg">
                        <img
                          src={url}
                          alt={`配图 ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        {/* 如果有超过3张图片，在第3张图片上显示剩余数量 */}
                        {index === 2 && share.media_urls && share.media_urls.length > 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              +{share.media_urls.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={share.author?.avatar_url || undefined} alt={share.author?.display_name || '匿名用户'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {share.author?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{share.author?.display_name || '匿名用户'}</span>
                <Badge variant="outline" className="text-xs">
                  作者
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(share.created_at)}
              </div>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(share.created_at)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-7 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function SharespearePage() {
  const [shares, setShares] = useState<SharespeareItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [activeTab, setActiveTab] = useState('experience') // 'experience' 或 'articles'

  // 获取分享数据
  useEffect(() => {
    const fetchShares = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/sharespeare?status=PUBLISHED&limit=50')
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        const result: ApiResponse = await response.json()
        setShares(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchShares()
  }, [])

  // 筛选和排序逻辑
  const filteredAndSortedShares = shares
    .filter(share => {
      const matchesSearch = share.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           share.content_rich.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const featuredShares = shares.slice(0, 3)
  const dynamicCategories = generateCategoriesFromShares(shares)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Sharespeare</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          学长学姐的经验分享平台，汇聚学习、职业、留学、创业等各领域的宝贵经验
        </p>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-medium">加载失败</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </Card>
      )}

      {/* 精选分享 */}
      {!loading && !error && featuredShares.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-semibold">最新分享</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredShares.map(share => (
              <ShareCard key={share.id} share={share} />
            ))}
          </div>
        </section>
      )}

      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索分享内容、标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新发布</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="mb-8">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('experience')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'experience'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            学长学姐经验分享
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'articles'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            文章分类
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'experience' && !loading && !error ? (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              全部分享 ({filteredAndSortedShares.length})
            </h2>
          </div>
          
          {filteredAndSortedShares.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedShares.map(share => (
                <ShareCard key={share.id} share={share} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无相关分享</p>
                <p>试试调整搜索条件</p>
              </div>
            </Card>
          )}
        </section>
      ) : !loading && !error ? (
        <section>
          {dynamicCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dynamicCategories.map(category => (
                <Card key={category.id} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {category.articles.map(article => (
                      <Link key={article.id} href={`/sharespeare/${article.id}`}>
                        <div className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <h4 className="font-medium mb-1 line-clamp-1">{article.title}</h4>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{article.author?.display_name || '匿名用户'} • {formatDate(article.created_at)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(article.published_at || article.created_at)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {category.articles.length === 3 && (
                    <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('experience')}>
                      查看更多 {category.name} 文章
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无分类内容</p>
                <p>当前数据库中还没有足够的内容进行分类展示</p>
              </div>
            </Card>
          )}
        </section>
      ) : null}
    </div>
  )
}