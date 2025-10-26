'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

export default function Home() {
  const router = useRouter()
  const { lang } = useI18n()

  useEffect(() => {
    // 首页直接跳转到 sharespeare 列表页
    router.replace('/sharespeare')
  }, [router])

  // 跳转中的占位内容，避免空白
  return (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      {lang === 'zh' ? '正在跳转到 Sharespeare...' : 'Redirecting to Sharespeare...'}
    </div>
  )
}
