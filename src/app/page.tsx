'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, Users, Calendar, Star, MessageSquare, BookOpen, Clock, MapPin, Award } from 'lucide-react'

export default function Home() {

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section - 社团介绍 */}
      <section className="text-center py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            欢迎来到
            <span className="text-primary block mt-2">校园新闻社</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            连接校园，分享故事，传递声音
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            Connecting Campus, Sharing Stories, Amplifying Voices
          </p>
          
          <div className="bg-accent/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">关于我们</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              校园新闻社成立于2020年，致力于为同学们提供一个分享校园生活、交流学习心得的平台。
              我们相信每个人都有自己独特的故事，每个声音都值得被听见。
              通过新闻报道、经验分享和互动交流，我们希望构建一个更加紧密的校园社区。
            </p>
          </div>
        </div>
      </section>

      {/* 日历系统 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">社团日历</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle>本周活动</CardTitle>
              </div>
              <CardDescription>
                查看本周的社团活动和重要事件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="text-sm font-medium text-primary">周一</div>
                <div className="flex-1">
                  <div className="font-medium">编辑部会议</div>
                  <div className="text-sm text-muted-foreground">下午3:00 - 会议室A</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="text-sm font-medium text-primary">周三</div>
                <div className="flex-1">
                  <div className="font-medium">新闻采访培训</div>
                  <div className="text-sm text-muted-foreground">下午4:00 - 多媒体教室</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="text-sm font-medium text-primary">周五</div>
                <div className="flex-1">
                  <div className="font-medium">周报发布</div>
                  <div className="text-sm text-muted-foreground">全天 - 线上发布</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/calendar">查看完整日历</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <CardTitle>本月规划</CardTitle>
              </div>
              <CardDescription>
                本月的重要活动和截止日期
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge variant="secondary">1月15日</Badge>
                <div className="flex-1">
                  <div className="font-medium">期末特刊策划</div>
                  <div className="text-sm text-muted-foreground">策划截止日期</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge variant="secondary">1月20日</Badge>
                <div className="flex-1">
                  <div className="font-medium">社团年度总结</div>
                  <div className="text-sm text-muted-foreground">年度活动回顾</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge variant="secondary">1月25日</Badge>
                <div className="flex-1">
                  <div className="font-medium">新学期招新</div>
                  <div className="text-sm text-muted-foreground">招新活动启动</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/calendar">查看月度计划</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 每周校园新闻 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">本周校园新闻</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
              <Newspaper className="h-12 w-12 text-blue-600" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">学校举办科技创新大赛</CardTitle>
              <CardDescription>
                本周学校成功举办了第五届科技创新大赛，吸引了全校200多名学生参与...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="h-4 w-4" />
                <span>2024年1月8日</span>
              </div>
              <Button variant="outline" size="sm">
                阅读全文
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">社团文化节圆满落幕</CardTitle>
              <CardDescription>
                为期三天的社团文化节在同学们的热情参与下圆满结束，各社团展示了精彩的才艺表演...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="h-4 w-4" />
                <span>2024年1月6日</span>
              </div>
              <Button variant="outline" size="sm">
                阅读全文
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-lg flex items-center justify-center">
              <Award className="h-12 w-12 text-purple-600" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">我校学生获得市级奖项</CardTitle>
              <CardDescription>
                在刚刚结束的市级学科竞赛中，我校多名学生获得优异成绩，为学校争得荣誉...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="h-4 w-4" />
                <span>2024年1月5日</span>
              </div>
              <Button variant="outline" size="sm">
                阅读全文
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Button asChild>
            <Link href="/news">查看更多新闻</Link>
          </Button>
        </div>
      </section>

      {/* 社团成员介绍 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">社团成员</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                李
              </div>
              <CardTitle className="text-lg">李明</CardTitle>
              <CardDescription>社长 / 主编</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                负责社团整体运营和新闻内容策划
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                王
              </div>
              <CardTitle className="text-lg">王小雨</CardTitle>
              <CardDescription>副社长 / 技术负责人</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                负责网站技术维护和数字化运营
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                张
              </div>
              <CardTitle className="text-lg">张思远</CardTitle>
              <CardDescription>编辑部部长</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                负责文章编辑和内容质量把控
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                陈
              </div>
              <CardTitle className="text-lg">陈佳音</CardTitle>
              <CardDescription>宣传部部长</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                负责社团宣传和活动策划
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 社团时间规划 */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">社团时间规划</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <CardTitle>日常活动时间</CardTitle>
              </div>
              <CardDescription>
                社团的常规活动安排
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge>周一</Badge>
                <div className="flex-1">
                  <div className="font-medium">编辑部会议</div>
                  <div className="text-sm text-muted-foreground">15:00 - 16:30</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge>周三</Badge>
                <div className="flex-1">
                  <div className="font-medium">新闻采访活动</div>
                  <div className="text-sm text-muted-foreground">16:00 - 17:30</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Badge>周五</Badge>
                <div className="flex-1">
                  <div className="font-medium">周报编辑发布</div>
                  <div className="text-sm text-muted-foreground">14:00 - 18:00</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                <CardTitle>活动地点</CardTitle>
              </div>
              <CardDescription>
                社团活动的主要场所
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">新闻社办公室</div>
                  <div className="text-sm text-muted-foreground">教学楼3楼 - 日常办公</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">多媒体教室</div>
                  <div className="text-sm text-muted-foreground">图书馆2楼 - 培训活动</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">学生活动中心</div>
                  <div className="text-sm text-muted-foreground">1楼大厅 - 大型活动</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 快速导航 */}
      <section className="py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">快速导航</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <CardTitle>留言板</CardTitle>
                </div>
                <CardDescription>
                  参与每周话题讨论，分享你的想法
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/message-board">进入留言板</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Sharespeare</CardTitle>
                </div>
                <CardDescription>
                  学长学姐经验分享和精彩文章
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/sharespeare">阅读分享</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>完整日历</CardTitle>
                </div>
                <CardDescription>
                  查看详细的活动安排和重要日期
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/calendar">查看日历</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
