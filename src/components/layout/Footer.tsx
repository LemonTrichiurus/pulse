import Link from 'next/link'
import { Newspaper } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-serif italic">
                Campus Pulse
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Catch the beat of campus - 连接校园，分享故事，传递声音。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground">
                  新闻中心
                </Link>
              </li>
              <li>
                <Link href="/topics" className="text-muted-foreground hover:text-foreground">
                  话题广场
                </Link>
              </li>
              <li>
                <Link href="/sharespeare" className="text-muted-foreground hover:text-foreground">
                  学长学姐分享
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-muted-foreground hover:text-foreground">
                  投稿中心
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-4">社区</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/birthdays" className="text-muted-foreground hover:text-foreground">
                  生日墙
                </Link>
              </li>
              <li>
                <Link href="/picks" className="text-muted-foreground hover:text-foreground">
                  每周推荐
                </Link>
              </li>
              <li>
                <Link href="/exams" className="text-muted-foreground hover:text-foreground">
                  考试日历
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">政策与规则</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about#community-rules" className="text-muted-foreground hover:text-foreground">
                  社区守则
                </Link>
              </li>
              <li>
                <Link href="/about#submission-guidelines" className="text-muted-foreground hover:text-foreground">
                  投稿须知
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="text-muted-foreground hover:text-foreground">
                  隐私与转载声明
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 校园新闻社. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}