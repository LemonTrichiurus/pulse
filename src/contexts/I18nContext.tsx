'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'zh' | 'en'

type Dict = Record<string, string>

const zh: Dict = {
  'nav.sharespeare': 'Sharespeare',
  'nav.topics': '留言板',
  'actions.submit': '投稿',
  'actions.my_submissions': '我的投稿',
  'actions.profile': '个人资料',
  'admin.admin': '管理',
  'admin.topics': '话题管理',
  'admin.comments': '评论审核',
  'auth.sign_out': '退出',
  'auth.sign_in': '登录',
  'topics.title': '留言板',
  'topics.subtitle': '分享想法，交流讨论',
  'topics.admin_button': '管理话题',
  'moderation.title': '评论审核',
  'moderation.subtitle': '审核待处理的评论',
  'moderation.back_to_topics': '返回话题管理',
  'moderation.pending_count': '条待审核',
  'moderation.topic_filter': '话题筛选：',
  'moderation.all_topics': '全部话题',
  'moderation.more_topics': '个话题',
  'moderation.locked': '已锁定',
  'moderation.unknown_user': '未知用户',
  'moderation.admin': '管理员',
  'moderation.moderator': '版主',
  'moderation.pending': '待审核',
  'moderation.no_pending_comments': '暂无待审核评论',
  'moderation.no_pending_for_topic': '该话题下暂无待审核评论',
  'moderation.all_reviewed': '所有评论都已审核完毕',
  'moderation.approve': '通过',
  'moderation.reject': '拒绝',
  'moderation.approve_title': '通过评论',
  'moderation.approve_description': '确定要通过这条评论吗？通过后，评论将对所有用户可见。',
  'moderation.reject_title': '拒绝评论',
  'moderation.reject_description': '请说明拒绝这条评论的原因（可选）。拒绝后，评论将不会公开显示，但作者可以看到拒绝状态和原因。',
  'moderation.reject_reason_label': '拒绝原因（可选）',
  'moderation.reject_reason_placeholder': '请输入拒绝原因，如：内容不当、违反社区规则等...',
  'moderation.cancel': '取消',
  'moderation.confirm_approve': '确认通过',
  'moderation.confirm_reject': '确认拒绝',
  'moderation.processing': '处理中...',
  'moderation.comment_approved': '评论已通过审核',
  'moderation.comment_rejected': '评论已拒绝',
  'moderation.operation_failed': '操作失败',
  'moderation.login_expired': '登录状态已失效，请重新登录',
  'pagination.previous': '上一页',
  'pagination.next': '下一页',
  'pagination.page_info': '第 {page} 页，共 {total} 页',
}

const en: Dict = {
  'nav.sharespeare': 'Sharespeare',
  'nav.topics': 'Topics',
  'actions.submit': 'Submit',
  'actions.my_submissions': 'My submissions',
  'actions.profile': 'Profile',
  'admin.admin': 'Admin',
  'admin.topics': 'Topic Management',
  'admin.comments': 'Comment Moderation',
  'auth.sign_out': 'Sign out',
  'auth.sign_in': 'Sign in',
  'topics.title': 'Topics',
  'topics.subtitle': 'Share ideas, join discussions',
  'topics.admin_button': 'Manage Topics',
  'moderation.title': 'Comment Moderation',
  'moderation.subtitle': 'Review pending comments',
  'moderation.back_to_topics': 'Back to Topic Management',
  'moderation.pending_count': 'pending',
  'moderation.topic_filter': 'Filter by topic:',
  'moderation.all_topics': 'All Topics',
  'moderation.more_topics': 'more topics',
  'moderation.locked': 'Locked',
  'moderation.unknown_user': 'Unknown User',
  'moderation.admin': 'Admin',
  'moderation.moderator': 'Moderator',
  'moderation.pending': 'Pending',
  'moderation.no_pending_comments': 'No pending comments',
  'moderation.no_pending_for_topic': 'No pending comments for this topic',
  'moderation.all_reviewed': 'All comments have been reviewed',
  'moderation.approve': 'Approve',
  'moderation.reject': 'Reject',
  'moderation.approve_title': 'Approve Comment',
  'moderation.approve_description': 'Are you sure you want to approve this comment? Once approved, it will be visible to all users.',
  'moderation.reject_title': 'Reject Comment',
  'moderation.reject_description': 'Please provide a reason for rejecting this comment (optional). Once rejected, the comment will not be publicly displayed, but the author can see the rejection status and reason.',
  'moderation.reject_reason_label': 'Rejection Reason (Optional)',
  'moderation.reject_reason_placeholder': 'Please enter the reason for rejection, such as: inappropriate content, violation of community rules, etc...',
  'moderation.cancel': 'Cancel',
  'moderation.confirm_approve': 'Confirm Approval',
  'moderation.confirm_reject': 'Confirm Rejection',
  'moderation.processing': 'Processing...',
  'moderation.comment_approved': 'Comment approved',
  'moderation.comment_rejected': 'Comment rejected',
  'moderation.operation_failed': 'Operation failed',
  'moderation.login_expired': 'Login session expired, please log in again',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.page_info': 'Page {page} of {total}',
}

function getDict(lang: Lang): Dict {
  return lang === 'zh' ? zh : en
}

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) as Lang | null
    if (saved === 'zh' || saved === 'en') {
      setLang(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang)
      try {
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
      } catch {}
    }
  }, [lang])

  const dict = useMemo(() => getDict(lang), [lang])
  const t = (key: string) => dict[key] ?? key

  const value: I18nContextValue = { lang, setLang, t }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}