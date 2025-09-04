'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, Clock, Eye, Heart, MessageCircle, Share2, BookOpen, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// 移除认证相关导入
import { toast } from 'sonner'
import Link from 'next/link'

// 模拟推荐数据
const mockRecommendations = {
  featured: [
    {
      id: '1',
      type: 'news',
      title: '我校在全国数学竞赛中获得优异成绩',
      excerpt: '在刚刚结束的全国高中数学联赛中，我校学生表现出色，共有15名同学获得省级一等奖...',
      author: '教务处',
      publishTime: '2024-01-20T10:00:00Z',
      readCount: 2580,
      likeCount: 156,
      commentCount: 42,
      category: '学校新闻',
      image: '/api/placeholder/400/200',
      tags: ['数学竞赛', '获奖', '学术成就'],
      score: 95
    },
    {
      id: '2',
      type: 'topic',
      title: '高三备考经验分享：如何在最后阶段提高成绩',
      excerpt: '距离高考还有不到半年时间，作为一名即将毕业的高三学生，我想分享一些备考心得...',
      author: '张同学',
      publishTime: '2024-01-19T15:30:00Z',
      readCount: 1890,
      likeCount: 234,
      commentCount: 67,
      category: '学习交流',
      tags: ['高考', '备考', '经验分享'],
      score: 92
    },
    {
      id: '3',
      type: 'sharespeare',
      title: '从零基础到编程大赛获奖：我的编程学习之路',
      excerpt: '两年前，我对编程一无所知。今天，我想分享自己从零开始学习编程，最终在全国青少年编程大赛中获奖的经历...',
      author: '李明',
      publishTime: '2024-01-18T20:15:00Z',
      readCount: 3240,
      likeCount: 445,
      commentCount: 89,
      category: '技能分享',
      tags: ['编程', '学习经验', '竞赛'],
      score: 98
    }
  ],
  trending: [
    {
      id: '4',
      type: 'topic',
      title: '关于学校食堂菜品改进的建议',
      author: '王同学',
      publishTime: '2024-01-21T12:00:00Z',
      readCount: 1560,
      likeCount: 89,
      commentCount: 156,
      category: '校园生活',
      trendScore: 85
    },
    {
      id: '5',
      type: 'news',
      title: '学校图书馆新增电子阅览室',
      author: '图书馆',
      publishTime: '2024-01-21T09:30:00Z',
      readCount: 980,
      likeCount: 67,
      commentCount: 23,
      category: '校园设施',
      trendScore: 78
    },
    {
      id: '6',
      type: 'sharespeare',
      title: '如何平衡学习与社团活动',
      author: '陈同学',
      publishTime: '2024-01-20T16:45:00Z',
      readCount: 1234,
      likeCount: 123,
      commentCount: 45,
      category: '时间管理',
      trendScore: 82
    }
  ],
  categories: [
    {
      name: '学习方法',
      count: 45,
      items: [
        { id: '7', title: '高效记忆法：如何快速记住英语单词', author: '英语老师', score: 88 },
        { id: '8', title: '数学解题技巧总结', author: '数学组', score: 85 },
        { id: '9', title: '文科生的理科学习心得', author: '高二学生', score: 82 }
      ]
    },
    {
      name: '校园生活',
      count: 38,
      items: [
        { id: '10', title: '社团招新：加入我们的摄影社', author: '摄影社', score: 79 },
        { id: '11', title: '运动会精彩瞬间回顾', author: '体育组', score: 76 },
        { id: '12', title: '宿舍生活小贴士', author: '生活委员', score: 74 }
      ]
    },
    {
      name: '升学指导',
      count: 32,
      items: [
        { id: '13', title: '大学专业选择指南', author: '升学顾问', score: 91 },
        { id: '14', title: '自主招生准备攻略', author: '教务处', score: 89 },
        { id: '15', title: '艺考生的备考建议', author: '艺术组', score: 86 }
      ]
    }
  ]
}

interface RecommendationItem {
  id: string
  type: 'news' | 'topic' | 'sharespeare'
  title: string
  excerpt?: string
  author: string
  publishTime: string
  readCount: number
  likeCount: number
  commentCount: number
  category: string
  image?: string
  tags?: string[]
  score: number
  trendScore?: number
}

function FeaturedCard({ item }: { item: RecommendationItem }) {
  // 移除认证相关逻辑
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.likeCount)

  const handleLike = () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '已取消点赞' : '点赞成功')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/${item.type}/${item.id}`)
    toast.success('链接已复制到剪贴板')
  }

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'news':
        return { name: '新闻', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: BookOpen }
      case 'topic':
        return { name: '话题', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: MessageCircle }
      case 'sharespeare':
        return { name: '分享', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Users }
      default:
        return { name: '内容', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: BookOpen }
    }
  }

  const typeInfo = getTypeInfo(item.type)
  const TypeIcon = typeInfo.icon

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {item.image && (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className={typeInfo.color}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeInfo.name}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              <Star className="w-3 h-3 mr-1" />
              推荐度 {item.score}%
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href={`/${item.type}/${item.id}`} className="hover:underline">
              <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
            </Link>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>{item.author}</span>
              <span>•</span>
              <span>{new Date(item.publishTime).toLocaleDateString('zh-CN')}</span>
              <span>•</span>
              <span>{item.category}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {item.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {item.excerpt}
          </p>
        )}
        
        {item.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {item.readCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {item.commentCount}
            </div>
          </div>
          
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
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendingItem({ item }: { item: RecommendationItem }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return BookOpen
      case 'topic': return MessageCircle
      case 'sharespeare': return Users
      default: return BookOpen
    }
  }

  const TypeIcon = getTypeIcon(item.type)

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              热度 {item.trendScore}%
            </span>
          </div>
          
          <Link href={`/${item.type}/${item.id}`} className="hover:underline">
            <h3 className="font-medium line-clamp-2 mb-2">{item.title}</h3>
          </Link>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{item.author}</span>
              <span>•</span>
              <span>{new Date(item.publishTime).toLocaleDateString('zh-CN')}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.readCount}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {item.likeCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CategorySection({ category }: { category: any }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <Badge variant="outline">{category.count} 篇内容</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {category.items.map((item: any, index: number) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                  index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium line-clamp-1 mb-1">{item.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.author}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {item.score}%
                  </div>
                </div>
              </div>
              
              {index === 0 && (
                <Award className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function WeeklyPage() {
  const [recommendations] = useState(mockRecommendations)
  const [selectedTab, setSelectedTab] = useState('featured')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Star className="w-8 h-8 text-yellow-500" />
          每周推荐
        </h1>
        <p className="text-lg text-muted-foreground">
          精选优质内容，发现校园精彩
        </p>
      </div>

      {/* 推荐算法说明 */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-300 dark:border-blue-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">智能推荐算法</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                我们的推荐系统综合考虑内容质量、用户互动、时效性和个人偏好，为您精选最有价值的校园内容。
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  质量评分
                </Badge>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  互动热度
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  时效性
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  个性化
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="featured">精选推荐</TabsTrigger>
          <TabsTrigger value="trending">热门趋势</TabsTrigger>
          <TabsTrigger value="categories">分类排行</TabsTrigger>
        </TabsList>
        
        <TabsContent value="featured" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">本周精选内容</h2>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                编辑推荐
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendations.featured.map(item => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="trending" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">热门趋势</h2>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                实时更新
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.trending.map(item => (
                <TrendingItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">分类排行榜</h2>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                <Award className="w-3 h-3 mr-1" />
                质量排序
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendations.categories.map(category => (
                <CategorySection key={category.name} category={category} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}