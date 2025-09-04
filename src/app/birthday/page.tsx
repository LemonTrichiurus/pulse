'use client'

import { useState, useEffect } from 'react'
import { Calendar, Gift, Cake, Search, Filter, Users, Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
// 移除认证相关导入
import { toast } from 'sonner'

// 模拟生日数据
const mockBirthdays = [
  {
    id: '1',
    name: '张小明',
    class: '高三(1)班',
    birthday: '2024-01-20',
    avatar: '/images/student-avatar-1.jpg',
    wishes: [
      {
        id: '1',
        author: '李小红',
        content: '生日快乐！祝你学习进步，身体健康！',
        created_at: '2024-01-20T08:30:00Z'
      },
      {
        id: '2',
        author: '王小刚',
        content: '生日快乐小明！希望你在新的一岁里更加优秀！',
        created_at: '2024-01-20T09:15:00Z'
      }
    ],
    is_today: true
  },
  {
    id: '2',
    name: '李小红',
    class: '高二(3)班',
    birthday: '2024-01-22',
    avatar: '/images/student-avatar-2.jpg',
    wishes: [],
    is_today: false
  },
  {
    id: '3',
    name: '王小刚',
    class: '高一(2)班',
    birthday: '2024-01-25',
    avatar: '/images/student-avatar-3.jpg',
    wishes: [
      {
        id: '3',
        author: '张小明',
        content: '提前祝你生日快乐！',
        created_at: '2024-01-18T16:20:00Z'
      }
    ],
    is_today: false
  },
  {
    id: '4',
    name: '陈小美',
    class: '高三(2)班',
    birthday: '2024-01-28',
    avatar: '/images/student-avatar-4.jpg',
    wishes: [],
    is_today: false
  },
  {
    id: '5',
    name: '刘小强',
    class: '高二(1)班',
    birthday: '2024-02-01',
    avatar: '/images/student-avatar-5.jpg',
    wishes: [],
    is_today: false
  }
]

interface Wish {
  id: string
  author: string
  content: string
  created_at: string
}

interface Birthday {
  id: string
  name: string
  class: string
  birthday: string
  avatar: string
  wishes: Wish[]
  is_today: boolean
}

function BirthdayCard({ birthday, onSendWish }: { birthday: Birthday; onSendWish: (birthdayId: string) => void }) {
  const [showWishes, setShowWishes] = useState(false)
  
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
      return '已过'
    }
  }

  const formatBirthday = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    })
  }

  const formatWishTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <Card className={`${birthday.is_today ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {birthday.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{birthday.name}</h3>
                {birthday.is_today && (
                  <Badge className="bg-yellow-500 text-white">
                    <Cake className="w-3 h-3 mr-1" />
                    今日生日
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{birthday.class}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              {formatBirthday(birthday.birthday)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(birthday.birthday)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="w-4 h-4" />
              {birthday.wishes.length} 条祝福
            </span>
            {birthday.wishes.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowWishes(!showWishes)}
                className="h-7 px-2"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {showWishes ? '收起' : '查看'}祝福
              </Button>
            )}
          </div>
          <Button 
            size="sm"
            onClick={() => onSendWish(birthday.id)}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <Gift className="w-4 h-4 mr-1" />
            送祝福
          </Button>
        </div>

        {/* 祝福列表 */}
        {showWishes && birthday.wishes.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {birthday.wishes.map(wish => (
              <div key={wish.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{wish.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatWishTime(wish.created_at)}
                  </span>
                </div>
                <p className="text-sm">{wish.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WishModal({ birthday, isOpen, onClose, onSubmit }: {
  birthday: Birthday | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
}) {
  const [wishContent, setWishContent] = useState('')

  const handleSubmit = () => {
    if (!wishContent.trim()) {
      toast.error('祝福内容不能为空')
      return
    }
    onSubmit(wishContent)
    setWishContent('')
  }

  if (!isOpen || !birthday) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            给 {birthday.name} 送祝福
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {birthday.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{birthday.name}</div>
                <div className="text-sm text-muted-foreground">{birthday.class}</div>
              </div>
            </div>
          </div>
          
          <Textarea
            placeholder="写下你的生日祝福..."
            value={wishContent}
            onChange={(e) => setWishContent(e.target.value)}
            className="mb-4"
            rows={4}
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-pink-500 hover:bg-pink-600">
              发送祝福
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BirthdayPage() {
  // 移除认证相关逻辑
  const [birthdays, setBirthdays] = useState(mockBirthdays)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [wishModalOpen, setWishModalOpen] = useState(false)
  const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null)

  // 筛选逻辑
  const filteredBirthdays = birthdays.filter(birthday => {
    const matchesSearch = birthday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         birthday.class.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || birthday.class.includes(selectedClass)
    const matchesMonth = selectedMonth === 'all' || 
                        new Date(birthday.birthday).getMonth() + 1 === parseInt(selectedMonth)
    return matchesSearch && matchesClass && matchesMonth
  })

  // 按日期排序
  const sortedBirthdays = filteredBirthdays.sort((a, b) => {
    const dateA = new Date(a.birthday)
    const dateB = new Date(b.birthday)
    return dateA.getTime() - dateB.getTime()
  })

  // 今日生日
  const todayBirthdays = birthdays.filter(birthday => birthday.is_today)

  // 即将到来的生日（7天内）
  const upcomingBirthdays = birthdays.filter(birthday => {
    const date = new Date(birthday.birthday)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 7
  })

  const handleSendWish = (birthdayId: string) => {
    if (!user) {
      toast.error('请先登录后再送祝福')
      return
    }
    
    const birthday = birthdays.find(b => b.id === birthdayId)
    if (birthday) {
      setSelectedBirthday(birthday)
      setWishModalOpen(true)
    }
  }

  const handleSubmitWish = (content: string) => {
    if (!selectedBirthday || !user) return

    const newWish = {
      id: Date.now().toString(),
      author: '我',
      content,
      created_at: new Date().toISOString()
    }

    setBirthdays(prev => prev.map(birthday => 
      birthday.id === selectedBirthday.id 
        ? { ...birthday, wishes: [...birthday.wishes, newWish] }
        : birthday
    ))

    setWishModalOpen(false)
    setSelectedBirthday(null)
    toast.success('祝福发送成功！')
  }

  const getClassOptions = () => {
    const classes = [...new Set(birthdays.map(b => b.class.split('(')[0]))]
    return classes.sort()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Cake className="w-8 h-8 text-pink-500" />
          生日墙
        </h1>
        <p className="text-lg text-muted-foreground">
          记录每一个特别的日子，传递温暖的祝福
        </p>
      </div>

      {/* 今日生日提醒 */}
      {todayBirthdays.length > 0 && (
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-50 to-pink-50 dark:from-yellow-950 dark:to-pink-950 border-yellow-300 dark:border-yellow-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <Gift className="w-5 h-5" />
                今日生日 ({todayBirthdays.length}人)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayBirthdays.map(birthday => (
                  <div key={birthday.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {birthday.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{birthday.name}</div>
                      <div className="text-sm text-muted-foreground">{birthday.class}</div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendWish(birthday.id)}
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      送祝福
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 即将到来的生日 */}
      {upcomingBirthdays.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">即将到来 ({upcomingBirthdays.length}人)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingBirthdays.map(birthday => (
              <Card key={birthday.id} className="border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {birthday.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{birthday.name}</div>
                      <div className="text-xs text-muted-foreground">{birthday.class}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {new Date(birthday.birthday).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSendWish(birthday.id)}
                      className="mt-2 w-full"
                    >
                      提前祝福
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              placeholder="搜索姓名或班级..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              {getClassOptions().map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="月份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部月份</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 生日列表 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            全部生日 ({sortedBirthdays.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            共 {birthdays.length} 位同学
          </div>
        </div>
        
        {sortedBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBirthdays.map(birthday => (
              <BirthdayCard 
                key={birthday.id} 
                birthday={birthday} 
                onSendWish={handleSendWish}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Cake className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无相关生日信息</p>
              <p>试试调整搜索条件或筛选条件</p>
            </div>
          </Card>
        )}
      </section>

      {/* 祝福弹窗 */}
      <WishModal
        birthday={selectedBirthday}
        isOpen={wishModalOpen}
        onClose={() => {
          setWishModalOpen(false)
          setSelectedBirthday(null)
        }}
        onSubmit={handleSubmitWish}
      />
    </div>
  )
}