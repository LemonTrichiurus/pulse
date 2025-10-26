'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/contexts/I18nContext'

export default function TopicsHeader() {
  const { t } = useI18n()
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('topics.title')}</h1>
        <p className="text-gray-600 mt-2">{t('topics.subtitle')}</p>
      </div>
      <Link href="/admin/topics">
        <Button variant="outline">
          {t('topics.admin_button')}
        </Button>
      </Link>
    </div>
  )
}