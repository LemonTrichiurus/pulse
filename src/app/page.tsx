'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, Users, Calendar, Star, MessageSquare, BookOpen, Clock, MapPin, Award } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SchoolCalendar from '@/components/SchoolCalendar'

// 定义与后端API返回一致的类型（仅取页面使用到的字段）
type NewsItem = {
  id: string
  title: string
  summary?: string | null
  content?: string
  category: 'SCHOOL' | 'ACADEMIC' | 'ACTIVITY' | 'ANNOUNCEMENT' | 'OTHER'
  featured_image?: string | null
  is_featured?: boolean | null
  publish_at?: string | null
  view_count?: number | null
}

type ListResponse = {
  data: NewsItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

type SharespeareItem = {
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

type SharespeareResponse = {
  data: SharespeareItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function Home() {
  const [featured, setFeatured] = useState<NewsItem | null>(null)
  const [latest, setLatest] = useState<NewsItem[]>([])
  const [sharespeare, setSharespeare] = useState<SharespeareItem[]>([])
  const [featuredSharespeare, setFeaturedSharespeare] = useState<SharespeareItem | null>(null)

  useEffect(() => {
    // 获取头版新闻（精选）
    fetch('/api/news?featured=true&limit=1')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((json: ListResponse) => {
        setFeatured(json.data?.[0] || null)
      })
      .catch(() => {
        // 忽略错误，保持UI可用
      })

    // 获取本周（最新）新闻
    fetch('/api/news?limit=3')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((json: ListResponse) => {
        setLatest(json.data || [])
      })
      .catch(() => {})

    // 获取Sharespeare精选文章
    fetch('/api/sharespeare?status=PUBLISHED&limit=3')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((json: SharespeareResponse) => {
        setSharespeare(json.data || [])
      })
      .catch(() => {})

    // 获取首页精选Sharespeare文章
    fetch('/api/homepage-config/featured-sharespeare')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((featuredData: SharespeareItem) => {
        setFeaturedSharespeare(featuredData)
      })
      .catch(() => {
        // 如果没有配置精选文章，则使用第一篇作为备选
        fetch('/api/sharespeare?status=PUBLISHED&limit=1')
          .then(res => res.ok ? res.json() : Promise.reject(res))
          .then((json: SharespeareResponse) => {
            setFeaturedSharespeare(json.data?.[0] || null)
          })
          .catch(() => {})
      })
  }, [])

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div>
      {/* Hero Section - 校园脉搏 */}
      <section className="bg-gray-900 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              校园脉搏
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Catch the Beat of Our Campus
            </p>
            <p className="text-lg text-gray-400 mb-12">
              凝聚・社区・互动 Cohesion, Community, Connection
            </p>
            
            <div className="max-w-3xl mx-auto mb-12">
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                校园脉搏是学生生活共享的平台，聚焦于凝聚学生群体，为同学提供各类资源、提供发声平台
              </p>
              <p className="text-base text-gray-400 leading-relaxed">
                Campus Pulse is a platform for sharing student life, dedicated to fostering a sense of community, providing resources, and offering students a voice
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">

      {/* 日历系统与头版新闻 */}
      <section className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧1/3 - 本月活动日历 */}
          <div className="lg:col-span-1">
            <SchoolCalendar />
          </div>

          {/* 右侧2/3 - 精品Sharespeare推荐 */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">精品Sharespeare推荐</h2>
            <Card className="hover:shadow-lg transition-shadow">
              <div className="aspect-[16/9] rounded-t-lg relative overflow-hidden">
                {featuredSharespeare?.media_url ? (
                  <img 
                    src={featuredSharespeare.media_url} 
                    alt={featuredSharespeare.title || '精品推荐'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600"></div>
                )}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <Badge className="mb-3 bg-purple-600 hover:bg-purple-700">精品推荐</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    {featuredSharespeare?.title || '高中生活的时间管理艺术'}
                  </h3>
                  <p className="text-lg opacity-90">
                    {featuredSharespeare?.summary || '分享我在高中三年中摸索出的高效学习与生活平衡之道'}
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(featuredSharespeare?.created_at) || '2024年1月8日'}</span>
                  </div>
                  {featuredSharespeare?.author && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={featuredSharespeare.author.avatar_url || undefined} alt={featuredSharespeare.author.display_name} />
                        <AvatarFallback className="text-xs">
                          {featuredSharespeare.author.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{featuredSharespeare.author.display_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {featuredSharespeare?.content_rich ? `${featuredSharespeare.content_rich.replace(/<[^>]*>/g, '').slice(0, 120)}...` : '作为一名即将毕业的高三学生，我想分享一些在时间管理方面的心得体会。从高一的迷茫到现在的从容，这个过程中我学会了如何在学业压力和个人兴趣之间找到平衡点。希望我的经验能够帮助到学弟学妹们...'}
                </p>
                <div className="flex gap-3">
                  {featuredSharespeare ? (
                    <Button asChild>
                      <Link href={`/sharespeare/${featuredSharespeare.id}`}>阅读全文</Link>
                    </Button>
                  ) : (
                    <Button disabled>阅读全文</Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/sharespeare">查看更多精选文章</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 每周校园新闻 - 暂时隐藏 */}
      {/* 
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">本周校园新闻</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latest.length > 0 ? (
            latest.map(item => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                  <Newspaper className="h-12 w-12 text-blue-600" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {item.summary && (
                    <CardDescription>
                      {item.summary}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(item.publish_at)}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/news/${item.id}`}>阅读全文</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                  <Newspaper className="h-12 w-12 text-blue-600" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">学校举办科技创新大赛</CardTitle>
                  <CardDescription>
                    本周学校成功举办了第五届科技创新大赛，吸引了全校200多名学生参与...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span>2024年1月8日</span>
                  </div>
                  <Button variant="outline" size="sm">阅读全文</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
                  <Users className="h-12 w-12 text-green-600" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">社团文化节圆满落幕</CardTitle>
                  <CardDescription>
                    为期三天的社团文化节在同学们的热情参与下圆满结束，各社团展示了精彩的才艺表演...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span>2024年1月6日</span>
                  </div>
                  <Button variant="outline" size="sm">阅读全文</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-lg flex items-center justify-center">
                  <Award className="h-12 w-12 text-purple-600" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">我校学生获得市级奖项</CardTitle>
                  <CardDescription>
                    在刚刚结束的市级学科竞赛中，我校多名学生获得优异成绩，为学校争得荣誉...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span>2024年1月5日</span>
                  </div>
                  <Button variant="outline" size="sm">阅读全文</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <div className="text-center mt-8">
          <Button asChild>
            <Link href="/news">查看更多新闻</Link>
          </Button>
        </div>
      </section>
      */}

      {/* Sharespeare精选文章 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Sharespeare精选文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharespeare.length > 0 ? (
            sharespeare.map((article, index) => {
              const gradients = [
                'from-amber-100 to-amber-200',
                'from-rose-100 to-rose-200', 
                'from-emerald-100 to-emerald-200'
              ]
              const iconColors = [
                'text-amber-600',
                'text-rose-600',
                'text-emerald-600'
              ]
              return (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  {/* 媒体内容显示 */}
                  {(article.media_url || (article.media_urls && article.media_urls.length > 0)) ? (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      {/* 单张图片显示 */}
                      {article.media_url && !article.media_urls && (
                        <img
                          src={article.media_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* 多张图片显示 */}
                      {article.media_urls && article.media_urls.length > 0 && (
                        <div className="w-full h-full relative">
                          <img
                            src={article.media_urls[0]}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                          {article.media_urls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                              +{article.media_urls.length - 1}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`aspect-video bg-gradient-to-br ${gradients[index % 3]} rounded-t-lg flex items-center justify-center`}>
                      <BookOpen className={`h-12 w-12 ${iconColors[index % 3]}`} />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.content_rich.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(article.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">经验分享</Badge>
                      {article.author && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={article.author.avatar_url || undefined} alt={article.author.display_name} />
                            <AvatarFallback className="text-xs">
                              {article.author.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Badge variant="outline">{article.author.display_name}</Badge>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sharespeare/${article.id}`}>阅读全文</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            // 加载状态或空状态的占位符
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">加载中...</CardTitle>
                  <CardDescription>
                    正在获取最新的精选文章...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span>--</span>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    加载中
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="text-center mt-8">
          <Button asChild>
            <Link href="/sharespeare">查看更多精选文章</Link>
          </Button>
        </div>
      </section>

      {/* 社团成员介绍和时间规划 */}
      <section className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧 - 社团成员介绍 */}
          <div>
            <h2 className="text-3xl font-bold mb-8">社团成员介绍</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    朱
                  </div>
                  <CardTitle className="text-lg">朱嘉旎</CardTitle>
                  <CardDescription>社长</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    负责社团整体运营和新闻内容策划
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    张
                  </div>
                  <CardTitle className="text-lg">张皓川</CardTitle>
                  <CardDescription>副社长</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    负责网站技术维护和数字化运营
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    林
                  </div>
                  <CardTitle className="text-lg">林雅琪</CardTitle>
                  <CardDescription>美编</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    负责视觉设计和美术编辑工作
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    李
                  </div>
                  <CardTitle className="text-lg">李桐</CardTitle>
                  <CardDescription>美编</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    负责图片处理和版面设计工作
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 右侧 - 社团时间规划 */}
          <div>
            <h2 className="text-3xl font-bold mb-8">社团时间规划</h2>
            <div className="space-y-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-primary" />
                    <CardTitle>编辑部例会</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-red-800">周一</div>
                        <div className="text-sm text-red-600">17:00-18:00</div>
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>采访写作培训</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium text-blue-800">周三</div>
                        <div className="text-sm text-blue-600">16:00-17:30</div>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle>艺术设计工作坊</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium text-green-800">周五</div>
                        <div className="text-sm text-green-600">15:30-16:30</div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    <CardTitle>校园采风活动</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium text-yellow-800">周日</div>
                        <div className="text-sm text-yellow-600">14:00-16:00</div>
                      </div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Button className="w-full" variant="outline">
                  加入我们
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  欢迎对新闻传媒、编辑、设计等感兴趣的同学加入我们！每周三下午在合作楼201有新成员见面会。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 快速导航 */}
      <section className="py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">快速导航</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <CardTitle>留言板</CardTitle>
                </div>
                <CardDescription>
                  参与每周话题讨论，分享你的想法
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/message-board">进入留言板</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Sharespeare</CardTitle>
                </div>
                <CardDescription>
                  学长学姐经验分享和精彩文章
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/sharespeare">阅读分享</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>完整日历</CardTitle>
                </div>
                <CardDescription>
                  查看详细的活动安排和重要日期
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/calendar">查看日历</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
