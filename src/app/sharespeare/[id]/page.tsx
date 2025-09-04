'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Eye, MessageCircle, Heart, Share2, User, GraduationCap, HelpCircle, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'

// 模拟数据
const mockShareDetail = {
  id: '1',
  title: '从高中到清华：我的学习方法分享',
  content: `大家好，我是2020届毕业生，现在在清华大学计算机系读大四。很高兴能在这里和学弟学妹们分享我的学习经验。

## 时间管理篇

高中三年，时间管理是最重要的技能之一。我的建议是：

1. **制定详细的学习计划**：每周日晚上花30分钟规划下一周的学习内容
2. **番茄工作法**：25分钟专注学习 + 5分钟休息，效率很高
3. **优先级排序**：重要且紧急的事情优先处理

## 学习方法篇

### 数学
- 重视基础概念的理解，不要死记硬背公式
- 多做题，但要注重质量而非数量
- 建立错题本，定期复习

### 物理
- 理解物理现象背后的原理
- 多做实验，培养物理直觉
- 学会画图分析问题

### 英语
- 每天坚持阅读英文文章
- 多听英语播客和TED演讲
- 背单词要结合语境

## 心态调整篇

高三压力很大，心态调整很重要：

1. **保持规律作息**：充足的睡眠是高效学习的基础
2. **适当运动**：每天至少30分钟运动，释放压力
3. **与朋友交流**：不要把压力憋在心里

## 考试技巧篇

- 考前一周不要再学新知识，重点复习已掌握的内容
- 考试时先做会做的题，再攻克难题
- 保持冷静，相信自己的能力

希望这些经验对大家有帮助！如果有具体问题，欢迎在下面的问答区提问。`,
  category: 'academic' as const,
  tags: ['学习方法', '高考经验', '清华大学', '时间管理'],
  author: {
    id: 'alumni1',
    name: '张学长',
    avatar: '/images/alumni-avatar-1.jpg',
    role: 'alumni' as const,
    graduation_year: 2020,
    university: '清华大学',
    major: '计算机科学与技术',
    bio: '清华大学计算机系在读，曾获得全国数学竞赛一等奖，热爱分享学习经验。'
  },
  view_count: 1234,
  like_count: 89,
  question_count: 12,
  created_at: '2024-01-10T09:00:00Z',
  is_featured: true,
  is_liked: false
}

// 模拟问答数据
const mockQuestions = [
  {
    id: '1',
    content: '学长你好！我现在高二，数学成绩一直不太稳定，有时候能考130+，有时候只有110左右。请问有什么方法可以让成绩更稳定吗？',
    author: {
      id: 'student1',
      name: '小明同学',
      role: 'member' as const
    },
    created_at: '2024-01-10T14:30:00Z',
    like_count: 8,
    is_liked: false,
    answer: {
      id: 'answer1',
      content: '这个问题很常见！成绩不稳定通常是因为基础不够扎实。我建议你：\n\n1. 梳理知识点，找出薄弱环节\n2. 针对薄弱点进行专项练习\n3. 考试时保持冷静，按照平时的节奏答题\n4. 建立错题本，定期复习\n\n稳定性需要时间培养，坚持下去一定会有改善的！',
      created_at: '2024-01-10T16:45:00Z',
      like_count: 15,
      is_liked: true
    }
  },
  {
    id: '2',
    content: '学长，我想问一下清华的计算机系怎么样？课程难度如何？就业前景好吗？',
    author: {
      id: 'student2',
      name: '小红同学',
      role: 'member' as const
    },
    created_at: '2024-01-11T10:20:00Z',
    like_count: 12,
    is_liked: true,
    answer: {
      id: 'answer2',
      content: '清华计算机系确实很棒！课程设置很全面，从基础的数据结构、算法，到前沿的人工智能、机器学习都有涉及。\n\n难度方面确实不小，但老师和同学都很优秀，学习氛围很好。就业前景非常好，很多同学都能进入顶级互联网公司或者选择继续深造。\n\n如果你对计算机感兴趣，建议提前学习一些编程基础，这样入学后会更容易适应。',
      created_at: '2024-01-11T15:30:00Z',
      like_count: 20,
      is_liked: false
    }
  },
  {
    id: '3',
    content: '学长，我现在高三了，感觉压力很大，经常失眠。你当时是怎么调节心态的？',
    author: {
      id: 'student3',
      name: '小李同学',
      role: 'member' as const
    },
    created_at: '2024-01-12T20:15:00Z',
    like_count: 6,
    is_liked: false,
    answer: null
  },
  {
    id: '4',
    content: '请问学长有推荐的数学参考书吗？我想在课外多做一些练习。',
    author: {
      id: 'student4',
      name: '小王同学',
      role: 'member' as const
    },
    created_at: '2024-01-13T09:45:00Z',
    like_count: 4,
    is_liked: false,
    answer: null
  }
]

interface Question {
  id: string
  content: string
  author: {
    id: string
    name: string
    role: 'member' | 'moderator' | 'admin'
  }
  created_at: string
  like_count: number
  is_liked: boolean
  answer?: {
    id: string
    content: string
    created_at: string
    like_count: number
    is_liked: boolean
  } | null
}

function QuestionItem({ question, isAuthor, onAnswer }: { 
  question: Question; 
  isAuthor: boolean;
  onAnswer: (questionId: string) => void;
}) {
  const [isLiked, setIsLiked] = useState(question.is_liked)
  const [likeCount, setLikeCount] = useState(question.like_count)
  const [answerLiked, setAnswerLiked] = useState(question.answer?.is_liked || false)
  const [answerLikeCount, setAnswerLikeCount] = useState(question.answer?.like_count || 0)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const handleAnswerLike = () => {
    setAnswerLiked(!answerLiked)
    setAnswerLikeCount(prev => answerLiked ? prev - 1 : prev + 1)
    toast.success(answerLiked ? '取消点赞' : '点赞成功')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        {/* 问题内容 */}
        <div className="mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{question.author.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(question.created_at)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {question.content}
              </p>
            </div>
          </div>
          
          {/* 问题操作 */}
          <div className="flex items-center gap-4 ml-11">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-8 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            {isAuthor && !question.answer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAnswer(question.id)}
                className="h-8 px-2 text-green-600 hover:text-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                回答
              </Button>
            )}
          </div>
        </div>

        {/* 回答内容 */}
        {question.answer && (
          <div className="ml-11 pl-4 border-l-2 border-green-200 dark:border-green-800">
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">作者回答</span>
                <span className="text-xs text-muted-foreground">{formatDate(question.answer.created_at)}</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-3">
                {question.answer.content}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnswerLike}
                className={`h-8 px-2 ${answerLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${answerLiked ? 'fill-current' : ''}`} />
                {answerLikeCount}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ShareDetailPage() {
  const params = useParams()
  const [share, setShare] = useState(mockShareDetail)
  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [isLiked, setIsLiked] = useState(share.is_liked)
  const [likeCount, setLikeCount] = useState(share.like_count)
  const [newQuestion, setNewQuestion] = useState('')
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null)
  const [answerContent, setAnswerContent] = useState('')
  
  // 移除用户认证相关的状态
  const isAuthor = false // 暂时禁用作者权限检查

  useEffect(() => {
    // 这里可以根据 params.id 获取具体的分享内容
    // 暂时使用模拟数据
  }, [params.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: share.title,
          text: share.title,
          url: window.location.href,
        })
        toast.success('分享成功')
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) {
      toast.error('问题内容不能为空')
      return
    }

    const newQuestionObj = {
      id: Date.now().toString(),
      content: newQuestion,
      author: {
        id: 'anonymous',
        name: '匿名用户',
        role: 'member' as const
      },
      created_at: new Date().toISOString(),
      like_count: 0,
      is_liked: false,
      answer: null
    }

    setQuestions(prev => [newQuestionObj, ...prev])
    setNewQuestion('')
    toast.success('提问成功！')
  }

  const handleAnswer = (questionId: string) => {
    setAnsweringQuestion(questionId)
  }

  const handleSubmitAnswer = () => {
    if (!answerContent.trim()) {
      toast.error('回答内容不能为空')
      return
    }

    setQuestions(prev => prev.map(q => 
      q.id === answeringQuestion 
        ? {
            ...q,
            answer: {
              id: Date.now().toString(),
              content: answerContent,
              created_at: new Date().toISOString(),
              like_count: 0,
              is_liked: false
            }
          }
        : q
    ))

    setAnsweringQuestion(null)
    setAnswerContent('')
    toast.success('回答成功！')
  }

  const handleCancelAnswer = () => {
    setAnsweringQuestion(null)
    setAnswerContent('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryName = (category: string) => {
    const categories = {
      academic: '学术经验',
      life: '生活分享',
      career: '职业规划',
      hobby: '兴趣爱好'
    }
    return categories[category as keyof typeof categories] || '其他'
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      life: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      career: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      hobby: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/sharespeare">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
          </Link>
        </div>

        {/* 文章头部 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getCategoryColor(share.category)}>
                    {getCategoryName(share.category)}
                  </Badge>
                  {share.is_featured && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3" />
                      精选
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-4">{share.title}</h1>
                
                {/* 作者信息 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{share.author.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {share.author.university} · {share.author.major} · {share.author.graduation_year}届
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 作者简介 */}
                <p className="text-sm text-muted-foreground mb-4">{share.author.bio}</p>
                
                {/* 文章信息 */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(share.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {share.view_count} 浏览
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {questions.length} 问答
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 文章内容 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-line leading-relaxed">
                {share.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 标签 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">相关标签：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {share.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleLike}
                  className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount}
                </Button>
                <Button variant="ghost" onClick={handleShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  分享
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* 问答区 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-xl font-semibold">问答区 ({questions.length})</h2>
          </div>

          {/* 提问框 */}
          {!isAuthor && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Textarea
                  placeholder="向作者提问，分享你的疑惑..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="mb-4"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitQuestion}>
                    提交问题
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 回答问题框 */}
          {answeringQuestion && (
            <Card className="mb-6 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="mb-3 text-sm text-green-600 dark:text-green-300">
                  正在回答问题...
                </div>
                <Textarea
                  placeholder="写下你的回答..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  className="mb-4"
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelAnswer}>
                    取消
                  </Button>
                  <Button onClick={handleSubmitAnswer}>
                    提交回答
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 问题列表 */}
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  isAuthor={isAuthor}
                  onAnswer={handleAnswer}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">还没有人提问，来做第一个提问者吧！</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}