'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExamsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/calendar')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在跳转到考试日历...</p>
      </div>
    </div>
  )
}