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