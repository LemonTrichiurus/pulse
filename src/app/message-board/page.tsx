'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, Clock, User, Send, Heart, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  likes: number
  replies: number
  status: 'approved' | 'pending' | 'rejected'
}

const currentTopic = {
  title: "新学期的目标与计划",
  description: "分享你在新学期的学习目标、个人计划或者想要尝试的新事物。让我们一起为新的开始加油！",
  week: "第2周",
  endDate: "2024年1月14日"
}

const sampleMessages: Message[] = [
  {
    id: '1',
    author: '张同学',
    content: '新学期我希望能够提高英语口语水平，计划每天练习30分钟。还想加入学校的辩论社，锻炼自己的表达能力。',
    timestamp: '2024-01-08 14:30',
    likes: 12,
    replies: 3,
    status: 'approved'
  },
  {
    id: '2',
    author: '李小明',
    content: '我的目标是在这学期读完10本课外书，已经列好了书单。第一本准备读《百年孤独》，听说很有意思！',
    timestamp: '2024-01-08 16:45',
    likes: 8,
    replies: 5,
    status: 'approved'
  },
  {
    id: '3',
    author: '王小雨',
    content: '想要学习一门新的编程语言，Python看起来很有趣。还计划参加学校的科技创新大赛，希望能做出一个有用的小项目。',
    timestamp: '2024-01-09 09:15',
    likes: 15,
    replies: 2,
    status: 'approved'
  }
]

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [newMessage, setNewMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !authorName.trim()) return

    setIsSubmitting(true)
    
    // 模拟提交过程
    setTimeout(() => {
      const message: Message = {
        id: Date.now().toString(),
        author: authorName,
        content: newMessage,
        timestamp: new Date().toLocaleString('zh-CN'),
        likes: 0,
        replies: 0,
        status: 'pending'
      }
      
      setMessages(prev => [message, ...prev])
      setNewMessage('')
      setAuthorName('')
      setIsSubmitting(false)
    }, 1000)
  }

  const handleLike = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
    ))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">留言板</h1>
        <p className="text-xl text-muted-foreground">
          分享想法，交流观点，共同成长
        </p>
      </div>

      {/* 本周话题 */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">本周话题</CardTitle>
            </div>
            <Badge variant="secondary">{currentTopic.week}</Badge>
          </div>
          <CardTitle className="text-xl text-primary">{currentTopic.title}</CardTitle>
          <CardDescription className="text-base">
            {currentTopic.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>话题截止时间：{currentTopic.endDate}</span>
          </div>
        </CardContent>
      </Card>

      {/* 发表留言 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            发表留言
          </CardTitle>
          <CardDescription>
            分享你的想法和观点，所有留言需要经过审核后才会显示
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="author">姓名</Label>
              <Input
                id="author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="请输入你的姓名"
                required
              />
            </div>
            <div>
              <Label htmlFor="message">留言内容</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="分享你对本周话题的想法..."
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '提交中...' : '发表留言'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 留言列表 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">留言列表</h2>
          <Badge variant="outline">{messages.length} 条留言</Badge>
        </div>

        {messages.map((message) => (
          <Card key={message.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {message.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{message.author}</span>
                      {message.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          审核中
                        </Badge>
                      )}
                      {message.status === 'approved' && (
                        <Badge variant="default" className="text-xs">
                          已审核
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{message.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed mb-4">{message.content}</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(message.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                  <span>{message.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{message.replies}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 使用说明 */}
      <Card className="mt-12 bg-accent/30">
        <CardHeader>
          <CardTitle className="text-lg">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 每周会更新一个新的讨论话题</p>
          <p>• 所有留言需要经过管理员审核后才会公开显示</p>
          <p>• 请文明发言，尊重他人观点</p>
          <p>• 鼓励分享真实想法和建设性意见</p>
        </CardContent>
      </Card>
    </div>
  )
}