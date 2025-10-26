'use client'

import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Topic {
  id: string
  title: string
}

interface ModerationFilterProps {
  topics: Topic[]
  currentTopicFilter?: string
}

export default function ModerationFilter({ topics, currentTopicFilter }: ModerationFilterProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center space-x-4 mb-6">
      <span className="text-sm font-medium">{t('moderation.topic_filter')}</span>
      <div className="flex space-x-2 flex-wrap">
        <Link href="/admin/comments">
          <Button 
            variant={!currentTopicFilter ? 'default' : 'outline'} 
            size="sm"
          >
            {t('moderation.all_topics')}
          </Button>
        </Link>
        {topics?.slice(0, 5).map((topic) => (
          <Link key={topic.id} href={`/admin/comments?topic=${topic.id}`}>
            <Button 
              variant={currentTopicFilter === topic.id ? 'default' : 'outline'} 
              size="sm"
              className="max-w-48 truncate"
            >
              {topic.title}
            </Button>
          </Link>
        ))}
        {topics && topics.length > 5 && (
          <span className="text-sm text-gray-500 self-center">
            +{topics.length - 5} {t('moderation.more_topics')}
          </span>
        )}
      </div>
    </div>
  )
}