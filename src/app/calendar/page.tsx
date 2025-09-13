'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { getEventsForMonth, getEventsForDate, eventTypeConfig, CalendarEvent, calendarEvents } from '@/lib/calendar-data'
import Link from 'next/link'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')

  // 获取当前月份的日历数据
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const days = []
    
    // 添加空白天数
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    
    // 添加月份中的天数
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const events = getEventsForDate(dateStr)
      days.push({ date, events })
    }
    
    return days
  }, [currentDate])

  // 获取当前月份的事件
  const monthEvents = useMemo(() => {
    return getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate])

  // 获取事件的优先级颜色
  const getEventPriority = (events: CalendarEvent[]) => {
    if (events.length === 0) return null
    
    const priorities = ['holiday', 'exam', 'activity', 'work']
    for (const priority of priorities) {
      if (events.some(event => event.type === priority)) {
        return priority
      }
    }
    return events[0].type
  }

  // 导航到上一个月
  const navigateToPrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  // 导航到下一个月
  const navigateToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // 导航到上一年
  const navigateToPrevYear = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(prev.getFullYear() - 1)
      return newDate
    })
  }

  // 导航到下一年
  const navigateToNextYear = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(prev.getFullYear() + 1)
      return newDate
    })
  }

  // 年视图的月份数据
  const yearData = useMemo(() => {
    const year = currentDate.getFullYear()
    const months = []
    
    for (let month = 0; month < 12; month++) {
      const monthEvents = getEventsForMonth(year, month + 1)
      months.push({
        month,
        name: new Date(year, month).toLocaleDateString('zh-CN', { month: 'long' }),
        events: monthEvents
      })
    }
    
    return months
  }, [currentDate])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Home className="w-4 h-4" />
            首页
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            校历
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            月视图
          </Button>
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('year')}
          >
            年视图
          </Button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：日历 */}
          <div className="lg:col-span-2">
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
                    <Button variant="outline" size="sm" onClick={navigateToPrevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={navigateToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* 日历网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarData.map((dayData, index) => {
                    if (!dayData) {
                      return <div key={`empty-${index}`} className="p-3 h-24"></div>
                    }
                    
                    const { date, events } = dayData
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === date.toDateString()
                    const priority = getEventPriority(events)
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 h-24 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          isToday ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : ''
                        } ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600 dark:text-blue-400' : ''
                        }`}>
                          {date.getDate()}
                        </div>
                        
                        {events.length > 0 && (
                          <div className="space-y-1">
                            {events.slice(0, 2).map((event, eventIndex) => {
                              const config = eventTypeConfig[event.type]
                              return (
                                <div
                                  key={eventIndex}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${config.bgColor} ${config.textColor}`}
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              )
                            })}
                            {events.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{events.length - 2} 更多
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧：活动图例和详情 */}
          <div className="space-y-6">
            {/* 活动图例 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">活动图例</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${config.bgColor}`}></div>
                    <span className="text-sm">{config.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* 本月活动列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">本月活动</CardTitle>
              </CardHeader>
              <CardContent>
                {monthEvents.length > 0 ? (
                  <div className="space-y-3">
                    {monthEvents.slice(0, 10).map((event, index) => {
                      const config = eventTypeConfig[event.type]
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${config.bgColor}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('zh-CN', {
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {monthEvents.length > 10 && (
                      <div className="text-xs text-muted-foreground text-center pt-2">
                        还有 {monthEvents.length - 10} 个活动...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    本月暂无活动安排
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 选中日期详情 */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate.toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const dayEvents = getEventsForDate(selectedDate)
                    return dayEvents.length > 0 ? (
                      <div className="space-y-3">
                        {dayEvents.map((event, index) => {
                          const config = eventTypeConfig[event.type]
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.bgColor}`}></div>
                                <span className="text-sm font-medium">{event.title}</span>
                              </div>
                              {event.description && (
                                <div className="text-xs text-muted-foreground ml-4">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        当日无活动安排
                      </div>
                    )
                  })()
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* 年视图 */
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{currentDate.getFullYear()}年</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigateToPrevYear}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToNextYear}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {yearData.map(({ month, name, events }) => (
              <Card 
                key={month} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCurrentDate(new Date(currentDate.getFullYear(), month, 1))
                  setViewMode('month')
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <div className="space-y-2">
                      {events.slice(0, 3).map((event, index) => {
                        const config = eventTypeConfig[event.type]
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.bgColor}`}></div>
                            <span className="text-sm truncate">{event.title}</span>
                          </div>
                        )
                      })}
                      {events.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{events.length - 3} 更多活动
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      暂无活动
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}