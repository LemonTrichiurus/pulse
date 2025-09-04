'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Clock, BookOpen, Plus, Edit, Trash2, ArrowLeft, Users, MapPin, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// 模拟每日规划数据
const mockDailyPlans = [
  {
    id: '1',
    title: '数学复习',
    description: '复习三角函数和导数相关内容',
    startTime: '08:00',
    endTime: '09:30',
    type: 'study' as const,
    priority: 'high' as const,
    location: '图书馆三楼',
    participants: ['张同学', '李同学'],
    completed: false
  },
  {
    id: '2',
    title: '英语听力练习',
    description: '完成听力练习册第5-8单元',
    startTime: '10:00',
    endTime: '11:00',
    type: 'study' as const,
    priority: 'medium' as const,
    location: '语音室',
    participants: [],
    completed: true
  },
  {
    id: '3',
    title: '社团会议',
    description: '讨论下周活动安排和预算分配',
    startTime: '14:00',
    endTime: '15:30',
    type: 'meeting' as const,
    priority: 'high' as const,
    location: '学生活动中心201',
    participants: ['王同学', '赵同学', '刘同学'],
    completed: false
  },
  {
    id: '4',
    title: '体育锻炼',
    description: '篮球训练，提高投篮命中率',
    startTime: '16:00',
    endTime: '17:30',
    type: 'exercise' as const,
    priority: 'medium' as const,
    location: '体育馆',
    participants: ['体育社团成员'],
    completed: false
  },
  {
    id: '5',
    title: '作业完成',
    description: '完成物理作业和化学实验报告',
    startTime: '19:00',
    endTime: '21:00',
    type: 'homework' as const,
    priority: 'high' as const,
    location: '宿舍',
    participants: [],
    completed: false
  }
]

// 模拟考试数据（从主日历页面复用）
const mockExams = [
  {
    id: '1',
    title: '高三第一次模拟考试',
    subject: '综合',
    date: '2024-01-22',
    time: '08:30-11:30',
    location: '教学楼A栋',
    grade: '高三',
    type: 'major' as const,
    description: '高三年级第一次模拟考试，包含语文、数学、英语、理综/文综'
  }
]

interface DailyPlan {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  type: 'study' | 'meeting' | 'exercise' | 'homework' | 'other'
  priority: 'high' | 'medium' | 'low'
  location: string
  participants: string[]
  completed: boolean
}

interface Exam {
  id: string
  title: string
  subject: string
  date: string
  time: string
  location: string
  grade: string
  type: 'major' | 'final' | 'quiz' | 'practical' | 'competition' | 'monthly'
  description: string
}

function PlanCard({ plan, onEdit, onDelete, onToggleComplete }: {
  plan: DailyPlan
  onEdit: (plan: DailyPlan) => void
  onDelete: (id: string) => void
  onToggleComplete: (id: string) => void
}) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'study':
        return { name: '学习', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: BookOpen }
      case 'meeting':
        return { name: '会议', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Users }
      case 'exercise':
        return { name: '运动', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: Users }
      case 'homework':
        return { name: '作业', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Edit }
      default:
        return { name: '其他', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: Clock }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700'
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700'
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-950 dark:border-gray-700'
    }
  }

  const typeInfo = getTypeInfo(plan.type)
  const IconComponent = typeInfo.icon

  return (
    <Card className={`${getPriorityColor(plan.priority)} ${plan.completed ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={typeInfo.color}>
              <IconComponent className="w-3 h-3 mr-1" />
              {typeInfo.name}
            </Badge>
            <Badge variant="outline" className={`${
              plan.priority === 'high' ? 'text-red-600 border-red-600' :
              plan.priority === 'medium' ? 'text-yellow-600 border-yellow-600' :
              'text-gray-600 border-gray-600'
            }`}>
              {plan.priority === 'high' ? '高优先级' : plan.priority === 'medium' ? '中优先级' : '低优先级'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(plan.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardTitle className={`text-lg ${plan.completed ? 'line-through' : ''}`}>
          {plan.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {plan.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {plan.startTime} - {plan.endTime}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {plan.location}
            </div>
          </div>
          
          {plan.participants.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>参与者: {plan.participants.join(', ')}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2">
            <Button
              variant={plan.completed ? "outline" : "default"}
              size="sm"
              onClick={() => onToggleComplete(plan.id)}
            >
              {plan.completed ? '标记未完成' : '标记完成'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreatePlanDialog({ onCreatePlan }: { onCreatePlan: (plan: Omit<DailyPlan, 'id'>) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'study' as const,
    priority: 'medium' as const,
    location: '',
    participants: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('请填写必要信息')
      return
    }

    onCreatePlan({
      ...formData,
      participants: formData.participants.split(',').map(p => p.trim()).filter(p => p),
      completed: false
    })
    
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'study',
      priority: 'medium',
      location: '',
      participants: ''
    })
    setOpen(false)
    toast.success('规划已添加')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加规划
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加每日规划</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入规划标题"
            />
          </div>
          
          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入详细描述"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">开始时间 *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">结束时间 *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">类型</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">学习</SelectItem>
                  <SelectItem value="meeting">会议</SelectItem>
                  <SelectItem value="exercise">运动</SelectItem>
                  <SelectItem value="homework">作业</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">优先级</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="location">地点</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="输入地点"
            />
          </div>
          
          <div>
            <Label htmlFor="participants">参与者</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              placeholder="用逗号分隔多个参与者"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function DailyPlanPage() {
  const params = useParams()
  const router = useRouter()
  const [plans, setPlans] = useState(mockDailyPlans)
  const [editingPlan, setEditingPlan] = useState<DailyPlan | null>(null)
  
  const dateParam = params.date as string
  const currentDate = new Date(dateParam)
  
  // 获取当天的考试安排
  const todayExams = mockExams.filter(exam => exam.date === dateParam)
  
  // 按时间排序规划
  const sortedPlans = plans.sort((a, b) => a.startTime.localeCompare(b.startTime))
  
  const handleCreatePlan = (planData: Omit<DailyPlan, 'id'>) => {
    const newPlan: DailyPlan = {
      ...planData,
      id: Date.now().toString()
    }
    setPlans([...plans, newPlan])
  }
  
  const handleEditPlan = (plan: DailyPlan) => {
    setEditingPlan(plan)
  }
  
  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(plan => plan.id !== id))
    toast.success('规划已删除')
  }
  
  const handleToggleComplete = (id: string) => {
    setPlans(plans.map(plan => 
      plan.id === id ? { ...plan, completed: !plan.completed } : plan
    ))
  }
  
  const completedCount = plans.filter(plan => plan.completed).length
  const totalCount = plans.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和导航 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            每日规划
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentDate.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-muted-foreground">总规划数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-muted-foreground">已完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{totalCount - completedCount}</div>
            <div className="text-sm text-muted-foreground">待完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">完成率</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 考试提醒 */}
      {todayExams.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-300 dark:border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Bell className="w-5 h-5" />
              今日考试提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayExams.map(exam => (
              <div key={exam.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    {exam.subject}
                  </Badge>
                  <span className="text-sm font-medium">{exam.time}</span>
                </div>
                <h3 className="font-medium mb-1">{exam.title}</h3>
                <div className="text-sm text-muted-foreground">
                  <div>{exam.location}</div>
                  <div>{exam.description}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          今日规划 ({sortedPlans.length}项)
        </h2>
        <CreatePlanDialog onCreatePlan={handleCreatePlan} />
      </div>
      
      {/* 规划列表 */}
      {sortedPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">今日暂无规划</p>
            <p>点击上方按钮添加新的规划</p>
          </div>
        </Card>
      )}
    </div>
  )
}