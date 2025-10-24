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
  tags?: number[] // 基于数据库的分类标签（1: Summer, 2: Hidden, 3: Creative）
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
      id: 'summer_stories',
      name: 'Summer Stories（夏校纪事）',
      description: '分享世界各地夏校的申请过程、课程体验、社交经历～',
      icon: '☀️',
      articles: shares.slice(0, 3)
    },
    {
      id: 'hidden_chapters',
      name: 'Hidden Chapters（隐藏的章节）',
      description: '生活中那些“未被讲述的故事”。',
      icon: '📖',
      articles: shares.slice(0, 3)
    },
    {
      id: 'creative_sparks',
      name: 'Creative Sparks（创意火花）',
      description: '摄影配文、短篇、艺术作品展示区',
      icon: '✨',
      articles: shares.slice(0, 3)
    }
  ]
  return categories.filter(category => category.articles.length > 0)
}

// 固定分类定义（基于数据库 tags）
const CATEGORY_DEFS = [
  {
    id: 'summer_stories',
    tagId: 1,
    name: 'Summer Stories（夏校纪事）',
    description: '分享世界各地夏校的申请过程、课程体验、社交经历～',
    icon: '☀️',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  {
    id: 'hidden_chapters',
    tagId: 2,
    name: 'Hidden Chapters（隐藏的章节）',
    description: '生活中那些“未被讲述的故事”。',
    icon: '📖',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    id: 'creative_sparks',
    tagId: 3,
    name: 'Creative Sparks（创意火花）',
    description: '摄影配文、短篇、艺术作品展示区',
    icon: '✨',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
]

interface TagItem { id: number; name: string; color?: string }
interface FeaturedShare {
  id: string
  title: string
  content_rich: string
  media_url: string | null
  media_urls: string[] | null
  published_at: string | null
  created_at: string
  status: 'DRAFT' | 'PUBLISHED'
  author?: { id: string; display_name: string; avatar_url: string | null }
}

function ShareCard({ share, size = 'default', tagsMap }: { share: SharespeareItem | FeaturedShare, size?: 'default' | 'large', tagsMap?: Record<number, string> }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [imgAspect, setImgAspect] = useState<number | null>(null)
  const [tileAspects, setTileAspects] = useState<Record<number, number>>({})

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

  // 根据 share.tags 匹配分类信息
  const matchedCategory = CATEGORY_DEFS.find(c => (share.tags || []).includes(c.tagId))
  const categoryInfo = matchedCategory
    ? { name: matchedCategory.name.split('（')[0], color: matchedCategory.color }
    : { name: '分享', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }

  return (
    <Link href={`/sharespeare/${share.id}`}>
      <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer group ${size === 'large' ? 'md:p-2' : ''}`}>
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
          
          <CardTitle className={`${size === 'large' ? 'text-xl md:text-2xl' : 'text-lg'} group-hover:text-blue-600 transition-colors line-clamp-2`}>
            {share.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div 
            className="text-muted-foreground mb-4 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: share.content_rich.substring(0, 200) + '...' }}
          />
          
          {(share.media_url || (share.media_urls && share.media_urls.length > 0)) && (
            <div className="mb-4">
              {share.media_url && !share.media_urls && (
              <div className="relative overflow-hidden rounded-lg">
                <div className="w-full" style={{ aspectRatio: imgAspect ? `${imgAspect}` : (size === 'large' ? '16/9' : '4/3') }}>
                  <img
                    src={share.media_url}
                    alt="文章配图"
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                      const iw = (e.currentTarget as HTMLImageElement).naturalWidth
                      const ih = (e.currentTarget as HTMLImageElement).naturalHeight
                      if (iw && ih) setImgAspect(iw / ih)
                    }}
                  />
                </div>
              </div>
              )}
              
              {share.media_urls && share.media_urls.length > 0 && (
                <div className="relative">
                  <div className={`grid gap-1 ${
                    share.media_urls.length === 1 ? 'grid-cols-1' :
                    share.media_urls.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {share.media_urls.slice(0, 3).map((url, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg">
                        <div className="w-full" style={{ aspectRatio: tileAspects[index] ? `${tileAspects[index]}` : (share.media_urls!.length === 1 ? '16/9' : share.media_urls!.length === 2 ? '4/3' : '1/1') }}>
                          <img
                            src={url}
                            alt={`配图 ${index + 1}`}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              const iw = (e.currentTarget as HTMLImageElement).naturalWidth
                              const ih = (e.currentTarget as HTMLImageElement).naturalHeight
                              if (iw && ih) setTileAspects(prev => ({ ...prev, [index]: iw / ih }))
                            }}
                          />
                        </div>
                        {index === 2 && share.media_urls && share.media_urls.length > 3 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
  const [sortBy, setSortBy] = useState('latest')
  // 替换分类为标签ID
  const [selectedTagId, setSelectedTagId] = useState<number | 'all'>('all')
  // 标签列表与映射
  const [tags, setTags] = useState<TagItem[]>([])
  const tagsMap = Object.fromEntries(tags.map(t => [t.id, t.name])) as Record<number, string>
  // 首页精选（单篇）
  const [featuredShare, setFeaturedShare] = useState<FeaturedShare | null>(null)

  // 获取分享数据
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        // 获取 Sharespeare 列表
        const respShares = await fetch('/api/sharespeare?status=PUBLISHED&limit=50')
        if (!respShares.ok) throw new Error('获取分享数据失败')
        const sharesJson: ApiResponse = await respShares.json()
        setShares(sharesJson.data)
        // 获取全部标签
        const respTags = await fetch('/api/tags')
        if (respTags.ok) {
          const tagsJson = await respTags.json()
          setTags(tagsJson.data || [])
        }
        // 获取首页精选（单篇）——兼容空响应或非 JSON
        const respFeatured = await fetch('/api/homepage-config/featured-sharespeare')
        if (respFeatured.ok) {
          const text = await respFeatured.text()
          if (text && text.trim().length > 0) {
            try {
              const featuredJson: FeaturedShare = JSON.parse(text)
              setFeaturedShare(featuredJson)
            } catch (e) {
              console.warn('解析精选数据失败，忽略该板块', e)
              setFeaturedShare(null)
            }
          } else {
            setFeaturedShare(null)
          }
        } else {
          setFeaturedShare(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // 筛选和排序逻辑
  const filteredAndSortedShares = shares
    .filter(share => {
      const matchesSearch = share.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        share.content_rich.toLowerCase().includes(searchTerm.toLowerCase())
      if (selectedTagId !== 'all') {
        const tagsArr = share.tags || []
        const matchesTag = tagsArr.includes(selectedTagId)
        return matchesSearch && matchesTag
      }
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
  // 分类板块已移除，dynamicCategories 不再使用

  return (
    <>
      {/* 黑底 Hero */}
      <section className="bg-[#0b1220] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Sharespeare</h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">A student-run space for voices, visions, and the art of sharing.</p>
        </div>
      </section>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-medium">加载失败</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </Card>
        </div>
      )}

      {/* 主体内容 */}
      {!loading && !error && (
        <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-8 max-w-[1400px]">
          {/* 顶部精选（单篇） */}
          {featuredShare && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-semibold">精选 Sharespeare</h2>
              </div>
              <div className="grid grid-cols-1">
                <ShareCard share={featuredShare as SharespeareItem} size="large" tagsMap={tagsMap} />
              </div>
            </section>
          )}

          {/* 搜索与排序 */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="搜索分享内容、标签..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="latest">最新发布</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* 标签 Chips：全部 + 数据库标签 */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant={selectedTagId === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTagId('all')}>全部</Button>
            {tags && tags.length > 0
              ? tags.map(tag => (
                  <Button key={tag.id} variant={selectedTagId === tag.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTagId(tag.id)}>
                    {tag.name}
                  </Button>
                ))
              : CATEGORY_DEFS.map(def => (
                  <Button key={def.tagId} variant={selectedTagId === def.tagId ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTagId(def.tagId)}>
                    {def.name}
                  </Button>
                ))
            }
          </div>

          {/* 列表内容 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">全部分享 ({filteredAndSortedShares.length})</h2>
            </div>
            {filteredAndSortedShares.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedShares.map((share) => (
                  <ShareCard key={share.id} share={share} tagsMap={tagsMap} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">暂无相关分享</p>
                  <p>试试调整搜索或标签</p>
                </div>
              </Card>
            )}
          </section>

          {/* 分类板块已移除 */}
        </div>
      )}
    </>
  )
}