'use client'

import { useI18n } from '@/contexts/I18nContext'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface ModerationEmptyStateProps {
  hasTopicFilter: boolean
}

export default function ModerationEmptyState({ hasTopicFilter }: ModerationEmptyStateProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardContent className="py-12 text-center text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">{t('moderation.no_pending_comments')}</h3>
        <p className="text-sm">
          {hasTopicFilter ? t('moderation.no_pending_for_topic') : t('moderation.all_reviewed')}
        </p>
      </CardContent>
    </Card>
  )
}