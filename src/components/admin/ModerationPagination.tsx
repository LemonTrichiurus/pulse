'use client'

import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ModerationPaginationProps {
  currentPage: number
  totalPages: number
  topicFilter?: string
}

export default function ModerationPagination({ 
  currentPage, 
  totalPages, 
  topicFilter 
}: ModerationPaginationProps) {
  const { t } = useI18n()

  if (totalPages <= 1) return null

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (topicFilter) {
      params.set('topic', topicFilter)
    }
    return `/admin/comments?${params.toString()}`
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)}>
          <Button variant="outline" size="sm">
            {t('pagination.previous')}
          </Button>
        </Link>
      )}
      
      <span className="text-sm text-gray-600">
        {t('pagination.page_info', { page: currentPage, total: totalPages })}
      </span>
      
      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)}>
          <Button variant="outline" size="sm">
            {t('pagination.next')}
          </Button>
        </Link>
      )}
    </div>
  )
}