'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Clock, BookOpen, Download, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// 模拟考试数据
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
  },
  {
    id: '2',
    title: '数学期末考试',
    subject: '数学',
    date: '2024-01-25',
    time: '14:00-16:00',
    location: '教学楼B栋',
    grade: '高二',
    type: 'final' as const,
    description: '高二年级数学期末考试'
  },
  {
    id: '3',
    title: '英语听力测试',
    subject: '英语',
    date: '2024-01-28',
    time: '09:00-10:00',
    location: '语音室',
    grade: '高一',
    type: 'quiz' as const,
    description: '高一年级英语听力专项测试'
  },
  {
    id: '4',
    title: '物理实验考试',
    subject: '物理',
    date: '2024-02-01',
    time: '15:00-17:00',
    location: '物理实验室',
    grade: '高二',
    type: 'practical' as const,
    description: '高二年级物理实验操作考试'
  },
  {
    id: '5',
    title: '语文作文竞赛',
    subject: '语文',
    date: '2024-02-05',
    time: '13:30-15:30',
    location: '阶梯教室',
    grade: '全年级',
    type: 'competition' as const,
    description: '全校语文作文竞赛'
  },
  {
    id: '6',
    title: '化学月考',
    subject: '化学',
    date: '2024-02-08',
    time: '10:00-11:30',
    location: '教学楼C栋',
    grade: '高三',
    type: 'monthly' as const,
    description: '高三年级化学月考'
  }
]

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

function ExamCard({ exam }: { exam: Exam }) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'major':
        return { name: '重要考试', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
      case 'final':
        return { name: '期末考试', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' }
      case 'quiz':
        return { name: '小测验', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
      case 'practical':
        return { name: '实验考试', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
      case 'competition':
        return { name: '竞赛', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
      case 'monthly':
        return { name: '月考', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
      default:
        return { name: '考试', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '明天'
    } else if (diffDays > 0) {
      return `${diffDays}天后`
    } else {
      return '已结束'
    }
  }

  const typeInfo = getTypeInfo(exam.type)
  const isUrgent = () => {
    const date = new Date(exam.date)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  }

  return (
    <Card className={`${isUrgent() ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={typeInfo.color}>
              {typeInfo.name}
            </Badge>
            {isUrgent() && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                紧急
              </Badge>
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {formatDate(exam.date)}
          </span>
        </div>
        <CardTitle className="text-lg">{exam.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{exam.subject}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{exam.grade}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            {new Date(exam.date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {exam.time} • {exam.location}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {exam.description}
        </p>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // 添加到日历的逻辑
              toast.success('已添加到个人日历')
            }}
          >
            添加到日历
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CalendarView({ exams, currentDate, onDateChange }: {
  exams: Exam[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const router = useRouter()
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getExamsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return exams.filter(exam => exam.date === dateString)
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null)

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onDateChange(newDate)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {currentDate.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long'
            })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="p-2 h-20"></div>
          ))}
          
          {days.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const dayExams = getExamsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div 
                key={day} 
                className={`p-1 h-20 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${isToday ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : ''}`}
                onClick={() => {
                  const dateString = date.toISOString().split('T')[0]
                  router.push(`/calendar/${dateString}`)
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayExams.slice(0, 2).map(exam => (
                    <div 
                      key={exam.id} 
                      className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded truncate"
                      title={exam.title}
                    >
                      {exam.title}
                    </div>
                  ))}
                  {dayExams.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayExams.length - 2} 更多
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WeekView({ exams, currentDate, onDateChange }: {
  exams: Exam[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const router = useRouter()
  
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek)
      weekDate.setDate(startOfWeek.getDate() + i)
      weekDates.push(weekDate)
    }
    return weekDates
  }
  
  const getExamsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return exams.filter(exam => exam.date === dateString)
  }
  
  const weekDates = getWeekDates(currentDate)
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    onDateChange(newDate)
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayExams = getExamsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const dayNames = ['日', '一', '二', '三', '四', '五', '六']
            
            return (
              <div key={index} className="space-y-2">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">{dayNames[index]}</div>
                  <div 
                    className={`text-lg font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 ${
                      isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                    }`}
                    onClick={() => {
                      const dateString = date.toISOString().split('T')[0]
                      router.push(`/calendar/${dateString}`)
                    }}
                  >
                    {date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1 min-h-[200px]">
                  {dayExams.map(exam => (
                    <div 
                      key={exam.id} 
                      className="text-xs p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded"
                      title={`${exam.title} - ${exam.time}`}
                    >
                      <div className="font-medium truncate">{exam.title}</div>
                      <div className="text-xs opacity-75">{exam.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CalendarPage() {
  const router = useRouter()
  const [exams, setExams] = useState(mockExams)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'week'>('list')

  // 筛选逻辑
  const filteredExams = exams.filter(exam => {
    const matchesGrade = selectedGrade === 'all' || exam.grade.includes(selectedGrade) || exam.grade === '全年级'
    const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject
    const matchesType = selectedType === 'all' || exam.type === selectedType
    return matchesGrade && matchesSubject && matchesType
  })

  // 按日期排序
  const sortedExams = filteredExams.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // 即将到来的考试（7天内）
  const upcomingExams = exams.filter(exam => {
    const date = new Date(exam.date)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const exportToICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//School News Site//Calendar//CN',
      'CALSCALE:GREGORIAN',
      ...filteredExams.map(exam => {
        const startDate = new Date(`${exam.date}T${exam.time.split('-')[0]}:00`)
        const endDate = new Date(`${exam.date}T${exam.time.split('-')[1]}:00`)
        
        return [
          'BEGIN:VEVENT',
          `UID:${exam.id}@school-news-site.com`,
          `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `SUMMARY:${exam.title}`,
          `DESCRIPTION:${exam.description}`,
          `LOCATION:${exam.location}`,
          'END:VEVENT'
        ].join('\n')
      }).join('\n'),
      'END:VCALENDAR'
    ].join('\n')

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exam-calendar.ics'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('日历文件已下载')
  }

  const getSubjects = () => {
    return [...new Set(exams.map(exam => exam.subject))].sort()
  }

  const getGrades = () => {
    return [...new Set(exams.map(exam => exam.grade.split('(')[0]))].filter(grade => grade !== '全年级').sort()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <CalendarIcon className="w-8 h-8 text-blue-500" />
          考试日历
        </h1>
        <p className="text-lg text-muted-foreground">
          掌握考试安排，合理规划复习时间
        </p>
      </div>

      {/* 即将到来的考试 */}
      {upcomingExams.length > 0 && (
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-300 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <AlertCircle className="w-5 h-5" />
                即将到来的考试 ({upcomingExams.length}场)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExams.map(exam => {
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString)
                    const today = new Date()
                    const diffTime = date.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffDays === 0) return '今天'
                    if (diffDays === 1) return '明天'
                    return `${diffDays}天后`
                  }

                  return (
                    <div key={exam.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {exam.subject}
                        </Badge>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {formatDate(exam.date)}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{exam.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        <div>{exam.time}</div>
                        <div>{exam.location}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 筛选和操作 */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              {getGrades().map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {getSubjects().map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="major">重要考试</SelectItem>
              <SelectItem value="final">期末考试</SelectItem>
              <SelectItem value="quiz">小测验</SelectItem>
              <SelectItem value="practical">实验考试</SelectItem>
              <SelectItem value="competition">竞赛</SelectItem>
              <SelectItem value="monthly">月考</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <div className="flex border rounded-lg">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none border-r-0"
            >
              列表视图
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none border-r-0"
            >
              周视图
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              月视图
            </Button>
          </div>
          
          <Button onClick={exportToICS} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出日历
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          exams={filteredExams} 
          currentDate={currentDate} 
          onDateChange={setCurrentDate}
        />
      ) : viewMode === 'week' ? (
        <WeekView 
          exams={filteredExams} 
          currentDate={currentDate} 
          onDateChange={setCurrentDate}
        />
      ) : (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              考试安排 ({sortedExams.length}场)
            </h2>
          </div>
          
          {sortedExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedExams.map(exam => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无相关考试安排</p>
                <p>试试调整筛选条件</p>
              </div>
            </Card>
          )}
        </section>
      )}
    </div>
  )
}