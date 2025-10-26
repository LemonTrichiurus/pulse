'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 首页直接跳转到 sharespeare 列表页
    router.replace('/sharespeare')
  }, [router])

  // 跳转中的占位内容，避免空白
  return (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      正在跳转到 Sharespeare...
    </div>
  )
}
