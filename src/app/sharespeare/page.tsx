'use client'

import { useState } from 'react'
import { Search, Filter, Plus, Eye, MessageCircle, Heart, Calendar, User, GraduationCap, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
// 移除认证相关导入

// 模拟分享数据
const mockShares = [
  {
    id: '1',
    title: '从高中到清华：我的学习方法分享',
    summary: '分享我从普通高中生到考入清华大学的学习经验，包括时间管理、学习方法、心态调整等方面的心得体会。',
    category: 'academic' as const,
    tags: ['学习方法', '高考经验', '清华大学'],
    author: {
      id: 'alumni1',
      name: '张学长',
      avatar: '/images/alumni-avatar-1.jpg',
      role: 'alumni' as const,
      graduation_year: 2020,
      university: '清华大学',
      major: '计算机科学与技术'
    },
    view_count: 1234,
    like_count: 89,
    comment_count: 45,
    created_at: '2024-01-10T09:00:00Z',
    is_featured: true
  },
  {
    id: '2',
    title: '互联网大厂实习经验分享',
    summary: '在字节跳动实习三个月的真实体验，包括面试准备、工作内容、团队氛围以及对未来职业规划的思考。',
    category: 'career' as const,
    tags: ['实习经验', '互联网', '字节跳动'],
    author: {
      id: 'alumni2',
      name: '李学姐',
      avatar: '/images/alumni-avatar-2.jpg',
      role: 'alumni' as const,
      graduation_year: 2019,
      university: '北京大学',
      major: '软件工程'
    },
    view_count: 987,
    like_count: 67,
    comment_count: 32,
    created_at: '2024-01-08T14:30:00Z',
    is_featured: false
  },
  {
    id: '3',
    title: '出国留学申请全攻略',
    summary: '从语言考试到文书写作，从选校到签证，详细分享我申请美国研究生的完整流程和经验教训。',
    category: 'study_abroad' as const,
    tags: ['留学申请', '美国研究生', 'GRE', '托福'],
    author: {
      id: 'alumni3',
      name: '王学长',
      avatar: '/images/alumni-avatar-3.jpg',
      role: 'alumni' as const,
      graduation_year: 2018,
      university: 'Stanford University',
      major: '电子工程'
    },
    view_count: 756,
    like_count: 54,
    comment_count: 28,
    created_at: '2024-01-05T16:45:00Z',
    is_featured: true
  },
  {
    id: '4',
    title: '医学院的学习生活分享',
    summary: '医学院的课程安排、学习压力、实习经历以及未来的职业发展方向，希望对想学医的学弟学妹有帮助。',
    category: 'academic' as const,
    tags: ['医学院', '学习生活', '职业规划'],
    author: {
      id: 'alumni4',
      name: '陈学姐',
      avatar: '/images/alumni-avatar-4.jpg',
      role: 'alumni' as const,
      graduation_year: 2017,
      university: '北京协和医学院',
      major: '临床医学'
    },
    view_count: 543,
    like_count: 41,
    comment_count: 19,
    created_at: '2024-01-03T11:20:00Z',
    is_featured: false
  },
  {
    id: '5',
    title: '创业路上的酸甜苦辣',
    summary: '毕业后选择创业的心路历程，从idea到产品，从融资到团队建设，分享创业路上的经验和教训。',
    category: 'entrepreneurship' as const,
    tags: ['创业经验', '团队管理', '融资'],
    author: {
      id: 'alumni5',
      name: '刘学长',
      avatar: '/images/alumni-avatar-5.jpg',
      role: 'alumni' as const,
      graduation_year: 2016,
      university: '上海交通大学',
      major: '工商管理'
    },
    view_count: 432,
    like_count: 33,
    comment_count: 15,
    created_at: '2024-01-01T08:15:00Z',
    is_featured: false
  }
]

// 文章分类数据
const articleCategories = [
  {
    id: 'astronomy',
    name: '天文地理',
    description: '探索宇宙奥秘，了解地球家园',
    icon: '🌟',
    articles: [
      { id: '1', title: '黑洞的奥秘：时空的扭曲者', author: '天文社', date: '2024-01-15', views: 234 },
      { id: '2', title: '地球气候变化的成因与影响', author: '地理社', date: '2024-01-12', views: 189 },
      { id: '3', title: '火星探索：人类的下一个家园？', author: '科学社', date: '2024-01-10', views: 156 }
    ]
  },
  {
    id: 'humanities',
    name: '人文哲学',
    description: '思辨人生，探讨存在的意义',
    icon: '📚',
    articles: [
      { id: '4', title: '苏格拉底的智慧：我知道我无知', author: '哲学社', date: '2024-01-14', views: 298 },
      { id: '5', title: '中国古代文学中的人生哲理', author: '文学社', date: '2024-01-11', views: 267 },
      { id: '6', title: '现代社会中的道德困境', author: '伦理学社', date: '2024-01-09', views: 201 }
    ]
  },
  {
    id: 'science',
    name: '科学技术',
    description: '前沿科技，改变世界的力量',
    icon: '🔬',
    articles: [
      { id: '7', title: '人工智能的发展与未来', author: '计算机社', date: '2024-01-13', views: 345 },
      { id: '8', title: '基因编辑技术的伦理思考', author: '生物社', date: '2024-01-08', views: 178 },
      { id: '9', title: '量子计算：下一代计算革命', author: '物理社', date: '2024-01-07', views: 223 }
    ]
  },
  {
    id: 'arts',
    name: '艺术文化',
    description: '美的追求，文化的传承',
    icon: '🎨',
    articles: [
      { id: '10', title: '文艺复兴时期的艺术革命', author: '美术社', date: '2024-01-06', views: 167 },
      { id: '11', title: '中国传统音乐的魅力', author: '音乐社', date: '2024-01-05', views: 134 },
      { id: '12', title: '现代建筑设计的美学原则', author: '建筑社', date: '2024-01-04', views: 198 }
    ]
  }
]

interface Share {
  id: string
  title: string
  summary: string
  category: 'academic' | 'career' | 'study_abroad' | 'entrepreneurship' | 'life'
  tags: string[]
  author: {
    id: string
    name: string
    avatar: string
    role: 'alumni' | 'teacher'
    graduation_year?: number
    university: string
    major: string
  }
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  is_featured: boolean
}

function ShareCard({ share }: { share: Share }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(share.like_count)

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

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'academic':
        return { name: '学术分享', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
      case 'career':
        return { name: '职业发展', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
      case 'study_abroad':
        return { name: '留学经验', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
      case 'entrepreneurship':
        return { name: '创业分享', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' }
      case 'life':
        return { name: '生活感悟', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' }
      default:
        return { name: '其他', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    }
  }

  const categoryInfo = getCategoryInfo(share.category)

  return (
    <Link href={`/sharespeare/${share.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={categoryInfo.color}>
                {categoryInfo.name}
              </Badge>
              {share.is_featured && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  精选
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
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {share.summary}
          </p>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-1 mb-4">
            {share.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {share.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{share.tags.length - 3}
              </Badge>
            )}
          </div>
          
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {share.author.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{share.author.name}</span>
                <Badge variant="outline" className="text-xs">
                  {share.author.role === 'alumni' ? '校友' : '老师'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {share.author.graduation_year && `${share.author.graduation_year}届 • `}
                {share.author.university} • {share.author.major}
              </div>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {share.view_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {share.comment_count}
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
  const [shares, setShares] = useState(mockShares)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [activeTab, setActiveTab] = useState('experience') // 'experience' 或 'articles'

  // 筛选和排序逻辑
  const filteredAndSortedShares = shares
    .filter(share => {
      const matchesSearch = share.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           share.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           share.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || share.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'popular':
          return b.view_count - a.view_count
        case 'liked':
          return b.like_count - a.like_count
        default:
          return 0
      }
    })

  const featuredShares = shares.filter(share => share.is_featured).slice(0, 3)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Sharespeare</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          学长学姐的经验分享平台，汇聚学习、职业、留学、创业等各领域的宝贵经验
        </p>
      </div>

      {/* 精选分享 */}
      {featuredShares.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-semibold">精选分享</h2>
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              <SelectItem value="academic">学术分享</SelectItem>
              <SelectItem value="career">职业发展</SelectItem>
              <SelectItem value="study_abroad">留学经验</SelectItem>
              <SelectItem value="entrepreneurship">创业分享</SelectItem>
              <SelectItem value="life">生活感悟</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新发布</SelectItem>
              <SelectItem value="popular">最多浏览</SelectItem>
              <SelectItem value="liked">最多点赞</SelectItem>
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
      {activeTab === 'experience' ? (
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
                <p>试试调整搜索条件或分类筛选</p>
              </div>
            </Card>
          )}
        </section>
      ) : (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articleCategories.map(category => (
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
                    <div key={article.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <h4 className="font-medium mb-1 line-clamp-1">{article.title}</h4>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{article.author} • {article.date}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  查看更多 {category.name} 文章
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}