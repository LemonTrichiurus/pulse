'use client'

import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface ModerationHeaderProps {
  pendingCount: number
}

export default function ModerationHeader({ pendingCount }: ModerationHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Link href="/admin/topics">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('moderation.back_to_topics')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('moderation.title')}</h1>
          <p className="text-gray-600 mt-1">{t('moderation.subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          {pendingCount} {t('moderation.pending_count')}
        </Badge>
      </div>
    </div>
  )
}