'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEventsForMonth, getEventsForDate, eventTypeConfig, CalendarEvent } from '@/lib/calendar-data'
import Link from 'next/link'

interface SchoolCalendarProps {
  className?: string
}

export default function SchoolCalendar({ className }: SchoolCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // 获取当前月份的事件
  const monthEvents = useMemo(() => {
    return getEventsForMonth(year, month)
  }, [year, month])

  // 获取当前月份的日历数据
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    
    // 添加上个月的日期（灰色显示）
    const prevMonth = new Date(year, month - 2, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: `${year}-${String(month - 1).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`
      })
    }

    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        day,
        isCurrentMonth: true,
        date: dateStr
      })
    }

    // 添加下个月的日期（灰色显示）
    const remainingDays = 42 - days.length // 6周 × 7天
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      days.push({
        day,
        isCurrentMonth: false,
        date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      })
    }

    return days
  }, [year, month])

  // 获取今天的日期字符串
  const today = new Date().toISOString().split('T')[0]

  // 切换到上个月
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  // 切换到下个月
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  // 获取日期的事件
  const getDateEvents = (date: string) => {
    return getEventsForDate(date)
  }

  // 获取日期的主要事件类型（用于显示颜色）
  const getDateMainEventType = (date: string) => {
    const events = getDateEvents(date)
    if (events.length === 0) return null
    
    // 优先级：考试 > 假期 > 学校活动 > 家长会 > 工作日调整 > 教师工作日
    const priority = ['exam', 'holiday', 'school-activity', 'parent-meeting', 'work-holiday', 'teacher-work']
    for (const type of priority) {
      const event = events.find(e => e.type === type)
      if (event) return event.type
    }
    return events[0].type
  }

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-6">本月活动</h2>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{year}年{monthNames[month - 1]}</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
            <div>日</div>
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div>六</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((dayData, index) => {
              const events = getDateEvents(dayData.date)
              const mainEventType = getDateMainEventType(dayData.date)
              const isToday = dayData.date === today
              const isSelected = dayData.date === selectedDate
              
              return (
                <div
                  key={index}
                  className={`
                    h-8 flex items-center justify-center text-sm relative cursor-pointer rounded-md transition-colors
                    ${
                      isToday
                        ? 'bg-primary text-primary-foreground font-medium'
                        : isSelected
                        ? 'bg-accent text-accent-foreground'
                        : dayData.isCurrentMonth
                        ? 'hover:bg-accent/50'
                        : 'text-muted-foreground'
                    }
                    ${
                      mainEventType && dayData.isCurrentMonth && !isToday
                        ? `${eventTypeConfig[mainEventType].color} text-white`
                        : ''
                    }
                  `}
                  onClick={() => setSelectedDate(dayData.date)}
                  title={events.length > 0 ? events.map(e => e.title).join(', ') : undefined}
                >
                  <span>{dayData.day}</span>
                  {events.length > 0 && dayData.isCurrentMonth && !isToday && (
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* 选中日期的事件详情 */}
          {selectedDate && (() => {
            const selectedEvents = getDateEvents(selectedDate)
            if (selectedEvents.length === 0) return null
            
            return (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-medium text-foreground">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric'
                  })} 的活动：
                </div>
                {selectedEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full mt-1 ${eventTypeConfig[event.type].color}`}></div>
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="text-muted-foreground">{event.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
          
          {/* 活动图例 */}
          <div className="space-y-2 pt-3 border-t">
            <div className="text-xs font-medium text-foreground mb-2">活动类型：</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const hasEventsOfType = monthEvents.some(event => event.type === type)
                if (!hasEventsOfType) return null
                
                return (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
                    <span className="text-muted-foreground">{config.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-4" asChild>
            <Link href="/calendar">查看完整校历</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}