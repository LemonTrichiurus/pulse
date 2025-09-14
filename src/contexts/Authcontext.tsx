'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthUser {
  id: string
  email: string
  displayName: string
  role: 'ADMIN' | 'MOD' | 'MEMBER'
  avatarUrl?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 获取用户详细信息
  const fetchUserDetails = async (authUser: User): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, avatar_url')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        console.error('获取用户详情失败:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        avatarUrl: data.avatar_url
      }
    } catch (error) {
      console.error('获取用户详情时发生错误:', error)
      return null
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error || !authUser) {
        setUser(null)
        return
      }

      const userDetails = await fetchUserDetails(authUser)
      setUser(userDetails)
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      setUser(null)
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    if (data.user) {
      const userDetails = await fetchUserDetails(data.user)
      setUser(userDetails)
    }
  }

  // 注册
  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })

    if (error) {
      throw error
    }

    // 创建用户资料
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          role: 'USER'
        })

      if (profileError) {
        console.error('创建用户资料失败:', profileError)
      }
    }

    return data
  }

  // 登出
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    setUser(null)
  }

  // 初始化和监听认证状态变化
  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          setUser(null)
        } else if (session?.user) {
          const userDetails = await fetchUserDetails(session.user)
          setUser(userDetails)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('初始化会话时发生错误:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('认证状态变化:', event, session?.user?.email)
        
        if (session?.user) {
          const userDetails = await fetchUserDetails(session.user)
          setUser(userDetails)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
