'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, Users, Calendar, Star, MessageSquare, BookOpen, Clock, MapPin, Award, GraduationCap, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SchoolCalendar from '@/components/SchoolCalendar'
import { redirect } from 'next/navigation'

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

// 新增：精选 Sharespeare 的返回类型（来自 /api/homepage-config/featured-sharespeare）
type FeaturedShare = {
  id: string
  title: string
  content_rich: string
  media_url: string | null
  media_urls: string[] | null
  published_at: string | null
  created_at: string
  status: 'DRAFT' | 'PUBLISHED'
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export default function Home() {
  // 取消重定向，改为展示“精选 Sharespeare”
  const [featured, setFeatured] = useState<FeaturedShare | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/homepage-config/featured-sharespeare')
        const json = await res.json()
        if (!res.ok || json?.error) throw new Error(json?.error || '获取精选 sharespeare 失败')
        setFeatured(json)
      } catch (e: any) {
        setError(e?.message || '获取精选 sharespeare 失败')
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="w-6 h-6 text-yellow-600" />
        <h1 className="text-2xl font-semibold">精选 Sharespeare</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      )}

      {error && (
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-medium">加载失败</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </Card>
      )}

      {!loading && !error && featured && (
        <Link href={`/sharespeare/${featured.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">精选</Badge>
                  {featured.published_at && (
                    <Badge variant="outline" className="text-green-600 border-green-600">已发布</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(featured.created_at)}
                </span>
              </div>
              <CardTitle className="text-lg">{featured.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(featured.published_at || featured.created_at)}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featured.media_url && (
                <div className="text-sm text-muted-foreground">内含媒体内容</div>
              )}
              <p className="text-muted-foreground mt-2 line-clamp-3">
                {featured.content_rich.replace(/<[^>]+>/g, '')}
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/sharespeare">
          <Button variant="outline">进入 Sharespeare</Button>
        </Link>
        <Link href="/news">
          <Button variant="outline">查看新闻</Button>
        </Link>
        <Link href="/topics">
          <Button variant="outline">话题广场</Button>
        </Link>
      </div>
    </div>
  )
}
